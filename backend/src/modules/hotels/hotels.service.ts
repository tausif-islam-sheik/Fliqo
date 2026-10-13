import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";

export interface HotelSearchParams {
  city: string;
  checkIn: string;
  checkOut: string;
  guests?: number;
}

@Injectable()
export class HotelsService {
  constructor(private prisma: PrismaService) {}

  search(params: HotelSearchParams) {
    if (!params.city || !params.checkIn || !params.checkOut) {
      throw new BadRequestException("city, checkIn and checkOut are required");
    }
    return this.prisma.hotel.findMany({
      where: { city: { contains: params.city }, isActive: true },
      orderBy: [{ featured: "desc" }, { stars: "desc" }],
      take: 20
    });
  }

  async details(idOrSlug: string) {
    const hotel = await this.prisma.hotel.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }
    });
    if (!hotel || !hotel.isActive) throw new NotFoundException("Hotel not found");
    return hotel;
  }

  async book(
    userId: string,
    body: { hotelId: string; checkIn: string; checkOut: string; rooms: Array<{ roomId: string; qty: number }>; contactEmail: string; contactPhone: string; idempotencyKey?: string }
  ) {
    const hotel = await this.prisma.hotel.findUnique({ where: { id: body.hotelId } });
    if (!hotel || !hotel.isActive) throw new NotFoundException("Hotel not available");
    if (body.idempotencyKey) {
      const existing = await this.prisma.booking.findUnique({ where: { idempotencyKey: body.idempotencyKey } });
      if (existing) return existing;
    }
    const catalog = (hotel.rooms as Array<{ id: string; name: string; price: number }>) ?? [];
    let total = 0;
    for (const r of body.rooms) {
      const room = catalog.find((c) => c.id === r.roomId);
      if (!room) throw new BadRequestException(`Unknown room ${r.roomId}`);
      total += room.price * (r.qty || 1);
    }
    if (total <= 0) throw new BadRequestException("Select at least one room");
    const nights = Math.max(
      1,
      Math.round((new Date(body.checkOut).getTime() - new Date(body.checkIn).getTime()) / 86_400_000)
    );
    total *= nights;
    const ref = `HQ${randomBytes(3).toString("hex").toUpperCase()}`;
    return this.prisma.booking.create({
      data: {
        bookingRef: ref,
        userId,
        type: "HOTEL",
        status: "PENDING_PAYMENT",
        totalAmount: total,
        currency: "BDT",
        supplierCost: total,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        expiresAt: new Date(Date.now() + 30 * 60_000),
        idempotencyKey: body.idempotencyKey,
        hotel: {
          create: {
            provider: "direct",
            hotelId: hotel.id,
            checkIn: new Date(body.checkIn),
            checkOut: new Date(body.checkOut),
            rooms: body.rooms as unknown as object,
            cancellationPolicy: { freeUntil: body.checkIn, note: "Free cancellation before check-in" }
          }
        }
      },
      include: { hotel: true }
    });
  }

  async cancel(userId: string, userType: string, bookingRef: string) {
    const booking = await this.prisma.booking.findUnique({ where: { bookingRef }, include: { hotel: true } });
    if (!booking || booking.type !== "HOTEL") throw new NotFoundException("Hotel booking not found");
    if (userType !== "STAFF" && booking.userId !== userId) throw new ForbiddenException();
    if (booking.status !== "PENDING_PAYMENT" && booking.status !== "CONFIRMED") {
      throw new BadRequestException(`Cannot cancel booking in ${booking.status}`);
    }
    return this.prisma.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED" } });
  }

  // ---- Admin ----
  upsertHotel(body: { id?: string; slug: string; name: string; city: string; stars?: number; amenities?: string[]; images?: string[]; rooms?: unknown[]; featured?: boolean; isActive?: boolean }) {
    const { id, ...data } = body;
    if (id) return this.prisma.hotel.update({ where: { id }, data: data as any });
    return this.prisma.hotel.create({ data: { ...data, rooms: (data.rooms ?? []) as any } as any });
  }
}
