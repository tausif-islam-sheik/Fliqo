import { Injectable, Logger } from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { MailService } from "../notifications/mail.service";

/**
 * Ticket issuance with retries (BullMQ-backed in later phase; inline with
 * backoff here so the flow works without Redis. PDF p.27).
 */
@Injectable()
export class TicketingService {
  private readonly logger = new Logger(TicketingService.name);
  constructor(
    private prisma: PrismaService,
    private mail: MailService
  ) {}

  async issueTicket(bookingId: string, attempt = 1): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { flight: true }
    });
    if (!booking || booking.type !== "FLIGHT") return;
    if (booking.status !== "PAID" && booking.status !== "TICKETING") return;

    await this.prisma.booking.update({ where: { id: bookingId }, data: { status: "TICKETING" } });
    try {
      // Supplier ticket() call lives here in later phase (provider.ticket(pnr)).
      const ticketNumbers = [`TK${randomBytes(3).toString("hex").toUpperCase()}`];
      const pnr = booking.flight?.pnr ?? `PNR${randomBytes(2).toString("hex").toUpperCase()}`;
      await this.prisma.$transaction([
        this.prisma.flightBooking.update({
          where: { bookingId },
          data: { pnr, ticketNumbers }
        }),
        this.prisma.booking.update({ where: { id: bookingId }, data: { status: "CONFIRMED" } }),
        this.prisma.analyticsEvent.create({
          data: { type: "TICKETED", productType: "FLIGHT", userId: booking.userId }
        })
      ]);
      // E-ticket email + SMS fan-out happens here (queued in later phase).
      this.logger.log(`Ticketed ${booking.bookingRef}: ${ticketNumbers.join(",")}`);
    } catch (e) {
      if (attempt < 3) {
        const delay = attempt * 2000;
        this.logger.warn(`Ticketing failed for ${booking.bookingRef}, retry ${attempt} in ${delay}ms`);
        setTimeout(() => this.issueTicket(bookingId, attempt + 1).catch(() => {}), delay);
      } else {
        await this.prisma.booking.update({ where: { id: bookingId }, data: { status: "TICKETING_FAILED" } });
        this.logger.error(`Ticketing failed permanently for ${booking.bookingRef}`);
      }
    }
  }
}
