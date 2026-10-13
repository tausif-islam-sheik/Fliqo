import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { FlightsService } from "../flights/flights.service";

export interface PassengerInput {
  paxType?: string;
  title?: string;
  firstName: string;
  lastName: string;
  dob?: string;
  passportNo?: string;
}

// DRAFT → PENDING_PAYMENT → PAID → TICKETING → CONFIRMED (+ side exits, PDF p.27).
// Only this module changes booking status; every change is audit-logged later.
const HOLD_MINUTES = 30;

function bookingRef() {
  return `FQ${randomBytes(3).toString("hex").toUpperCase()}`;
}

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private flights: FlightsService
  ) {}

  async createFlightBooking(
    userId: string,
    body: {
      offerId: string;
      passengers: PassengerInput[];
      contactEmail: string;
      contactPhone: string;
      idempotencyKey?: string;
    }
  ) {
    if (!body.offerId || !body.passengers?.length || !body.contactEmail || !body.contactPhone) {
      throw new BadRequestException("offerId, passengers, contactEmail and contactPhone are required");
    }
    // Idempotent retry: same key returns the original booking, never a duplicate
    if (body.idempotencyKey) {
      const existing = await this.prisma.booking.findUnique({
        where: { idempotencyKey: body.idempotencyKey },
        include: { flight: true }
      });
      if (existing) return existing;
    }
    const offer = await this.flights.reprice(body.offerId);
    const total = offer.price * body.passengers.length;
    const ref = bookingRef();
    const booking = await this.prisma.booking.create({
      data: {
        bookingRef: ref,
        userId,
        type: "FLIGHT",
        status: "PENDING_PAYMENT",
        totalAmount: total,
        currency: offer.currency,
        supplierCost: total,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        expiresAt: new Date(Date.now() + HOLD_MINUTES * 60_000),
        idempotencyKey: body.idempotencyKey,
        flight: {
          create: {
            provider: offer.provider,
            itinerary: offer as unknown as object,
            ticketingDeadline: new Date(Date.now() + HOLD_MINUTES * 60_000)
          }
        },
        passengers: {
          create: body.passengers.map((p) => ({
            paxType: p.paxType ?? "ADULT",
            title: p.title,
            firstName: p.firstName,
            lastName: p.lastName,
            dob: p.dob ? new Date(p.dob) : undefined,
            passportNo: p.passportNo
          }))
        }
      },
      include: { flight: true, passengers: true }
    });
    await this.prisma.analyticsEvent
      .create({ data: { type: "START_CHECKOUT", productType: "FLIGHT", route: `${offer.from}-${offer.to}`, userId } })
      .catch(() => {});
    return booking;
  }

  async getByRef(userId: string, userType: string, ref: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingRef: ref },
      include: { flight: true, passengers: true, payments: true }
    });
    if (!booking) throw new NotFoundException("Booking not found");
    if (userType !== "STAFF" && booking.userId !== userId) throw new ForbiddenException();
    // Lazy expiry: unpaid past hold window resolves to a known state (PDF p.27)
    if (booking.status === "PENDING_PAYMENT" && booking.expiresAt && booking.expiresAt < new Date()) {
      return this.prisma.booking.update({
        where: { id: booking.id },
        data: { status: "EXPIRED" },
        include: { flight: true, passengers: true, payments: true }
      });
    }
    return booking;
  }

  /** Called by the expiry worker (BullMQ in later phase); exposed for tests/admin. */
  async expireUnpaid() {
    const res = await this.prisma.booking.updateMany({
      where: { status: "PENDING_PAYMENT", expiresAt: { lt: new Date() } },
      data: { status: "EXPIRED" }
    });
    return { expired: res.count };
  }
}
