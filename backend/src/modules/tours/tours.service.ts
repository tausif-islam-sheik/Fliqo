import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ToursService {
  constructor(private prisma: PrismaService) {}

  browse() {
    return this.prisma.tourPackage.findMany({
      where: { isActive: true },
      include: { departures: { orderBy: { startDate: "asc" }, take: 5 } },
      orderBy: { createdAt: "desc" }
    });
  }

  async details(slug: string) {
    const pkg = await this.prisma.tourPackage.findUnique({
      where: { slug },
      include: { departures: { orderBy: { startDate: "asc" } } }
    });
    if (!pkg || !pkg.isActive) throw new NotFoundException("Tour not found");
    return pkg;
  }

  async book(userId: string, body: { departureId: string; paxCount: number; contactEmail: string; contactPhone: string; idempotencyKey?: string }) {
    const dep = await this.prisma.tourDeparture.findUnique({ where: { id: body.departureId } });
    if (!dep) throw new NotFoundException("Departure not found");
    if (dep.seatsLeft < body.paxCount) throw new BadRequestException("Not enough seats left");
    if (body.idempotencyKey) {
      const existing = await this.prisma.booking.findUnique({ where: { idempotencyKey: body.idempotencyKey } });
      if (existing) return existing;
    }
    const total = Number(dep.price) * body.paxCount;
    const ref = `TQ${randomBytes(3).toString("hex").toUpperCase()}`;
    const booking = await this.prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          bookingRef: ref,
          userId,
          type: "TOUR",
          status: "PENDING_PAYMENT",
          totalAmount: total,
          currency: "BDT",
          supplierCost: total,
          contactEmail: body.contactEmail,
          contactPhone: body.contactPhone,
          expiresAt: new Date(Date.now() + 30 * 60_000),
          idempotencyKey: body.idempotencyKey,
          tour: { create: { departureId: dep.id, paxCount: body.paxCount } }
        },
        include: { tour: true }
      });
      await tx.tourDeparture.update({ where: { id: dep.id }, data: { seatsLeft: { decrement: body.paxCount } } });
      return b;
    });
    return booking;
  }

  // ---- Admin ----
  upsertPackage(body: { id?: string; slug: string; title: string; destination: string; durationDays: number; itinerary: unknown; inclusions?: string[]; basePrice: number; images?: string[]; isActive?: boolean }) {
    const { id, ...data } = body;
    const payload = { ...data, itinerary: data.itinerary as any } as any;
    if (id) return this.prisma.tourPackage.update({ where: { id }, data: payload });
    return this.prisma.tourPackage.create({ data: payload });
  }

  upsertDeparture(body: { id?: string; packageId: string; startDate: string; seatsTotal: number; price: number }) {
    const { id, ...rest } = body;
    const data = { packageId: rest.packageId, startDate: new Date(rest.startDate), seatsTotal: rest.seatsTotal, seatsLeft: rest.seatsTotal, price: rest.price } as any;
    if (id) return this.prisma.tourDeparture.update({ where: { id }, data });
    return this.prisma.tourDeparture.create({ data });
  }
}
