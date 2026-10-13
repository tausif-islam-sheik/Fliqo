import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { MockGateway } from "./gateways/mock.gateway";
import { TicketingService } from "./ticketing.service";

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private gateway: MockGateway,
    private ticketing: TicketingService
  ) {}

  async init(userId: string, bookingRef: string, idempotencyKey?: string) {
    if (idempotencyKey) {
      const existing = await this.prisma.payment.findUnique({
        where: { idempotencyKey },
        include: { booking: true }
      });
      if (existing) return this.toSession(existing as any);
    }
    const booking = await this.prisma.booking.findUnique({ where: { bookingRef } });
    if (!booking) throw new NotFoundException("Booking not found");
    if (booking.userId !== userId) throw new ForbiddenException();
    if (booking.status === "EXPIRED") throw new BadRequestException("Booking hold expired — please search again");
    if (booking.status !== "PENDING_PAYMENT") {
      throw new BadRequestException(`Booking is ${booking.status}, payment not allowed`);
    }
    // Reuse an existing pending payment for the same booking+amount (double-click safe)
    const pending = await this.prisma.payment.findFirst({
      where: { bookingId: booking.id, status: "PENDING", amount: booking.totalAmount }
    });
    if (pending) return this.toSession(pending);

    const session = this.gateway.createSession(Number(booking.totalAmount), booking.currency);
    const payment = await this.prisma.payment.create({
      data: {
        bookingId: booking.id,
        gateway: this.gateway.name,
        gatewayTxnId: session.gatewayTxnId,
        amount: booking.totalAmount,
        status: "PENDING",
        idempotencyKey
      }
    });
    return { paymentId: payment.id, ...session, amount: Number(booking.totalAmount) };
  }

  private toSession(p: { id: string; gatewayTxnId: string | null; amount: unknown }) {
    const web = process.env.WEB_URL ?? "http://localhost:3000";
    return {
      paymentId: p.id,
      gatewayTxnId: p.gatewayTxnId!,
      redirectUrl: `${web}/mock-gateway/pay?txn=${p.gatewayTxnId}`,
      amount: Number(p.amount as any)
    };
  }

  /**
   * Gateway IPN/webhook — must be idempotent: duplicate gateway retries
   * return the current state without double-processing (PDF p.27).
   */
  async handleIpn(gatewayTxnId: string, ok: boolean) {
    const payment = await this.prisma.payment.findUnique({ where: { gatewayTxnId } });
    if (!payment) throw new NotFoundException("Unknown transaction");
    if (payment.status === "SUCCESS") return { status: "SUCCESS", bookingRef: await this.refOf(payment.bookingId) };
    if (ok) this.gateway.markPaid(gatewayTxnId, true);

    // Server-to-server validation before marking paid — never trust the redirect.
    const v = await this.gateway.validate(gatewayTxnId);
    const booking = await this.prisma.booking.findUnique({ where: { id: payment.bookingId } });
    if (!booking) throw new NotFoundException("Booking not found");

    if (!ok || !v.success) {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
      if (booking.status === "PENDING_PAYMENT") {
        await this.prisma.booking.update({ where: { id: booking.id }, data: { status: "PAYMENT_FAILED" } });
      }
      return { status: "FAILED", bookingRef: booking.bookingRef };
    }
    if (Number(v.amount) !== Number(booking.totalAmount) || v.currency !== booking.currency) {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
      throw new BadRequestException("Amount/currency mismatch");
    }
    await this.prisma.$transaction([
      this.prisma.payment.update({ where: { id: payment.id }, data: { status: "SUCCESS" } }),
      this.prisma.booking.update({ where: { id: booking.id }, data: { status: "PAID" } }),
      this.prisma.analyticsEvent.create({
        data: { type: "PAID", productType: "FLIGHT", userId: booking.userId }
      })
    ]);
    // Ticket async (queued in later phase) — fire and forget with retries inside.
    this.ticketing.issueTicket(booking.id).catch(() => {});
    return { status: "SUCCESS", bookingRef: booking.bookingRef };
  }

  private async refOf(bookingId: string) {
    const b = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    return b?.bookingRef;
  }

  /** Amount display for the (mock) hosted gateway page. */
  async session(gatewayTxnId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { gatewayTxnId } });
    if (!payment) throw new NotFoundException("Unknown transaction");
    return { amount: Number(payment.amount), gateway: payment.gateway, status: payment.status };
  }

  async refund(userId: string, userType: string, paymentId: string, amount?: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true }
    });
    if (!payment) throw new NotFoundException("Payment not found");
    if (userType !== "STAFF" && payment.booking.userId !== userId) throw new ForbiddenException();
    if (payment.status !== "SUCCESS") throw new BadRequestException("Only successful payments can be refunded");
    const refundAmount = amount ?? Number(payment.amount);
    const refund = await this.prisma.refund.create({
      data: {
        bookingId: payment.bookingId,
        paymentId: payment.id,
        amount: refundAmount,
        reason: "Customer request",
        status: "COMPLETED"
      }
    });
    await this.prisma.$transaction([
      this.prisma.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED" } }),
      this.prisma.booking.update({ where: { id: payment.bookingId }, data: { status: "REFUNDED" } })
    ]);
    return refund;
  }

  invoice(bookingRef: string, userId: string, userType: string) {
    return this.prisma.booking.findFirst({
      where: {
        bookingRef,
        ...(userType === "STAFF" ? {} : { userId })
      },
      include: { flight: true, passengers: true, payments: true }
    });
  }
}
