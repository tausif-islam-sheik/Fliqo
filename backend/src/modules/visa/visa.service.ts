import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class VisaService {
  constructor(private prisma: PrismaService) {}

  countries() {
    return this.prisma.visaCountry.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  }

  async requirements(code: string) {
    const c = await this.prisma.visaCountry.findUnique({ where: { code } });
    if (!c || !c.isActive) throw new NotFoundException("Country not found");
    return c;
  }

  async apply(userId: string, body: { country: string; visaType: string; documents?: string[]; contactEmail: string; contactPhone: string }) {
    const c = await this.prisma.visaCountry.findUnique({ where: { code: body.country } });
    if (!c) throw new BadRequestException("Unknown country");
    const ref = `VQ${randomBytes(3).toString("hex").toUpperCase()}`;
    return this.prisma.booking.create({
      data: {
        bookingRef: ref,
        userId,
        type: "VISA",
        status: "PENDING_PAYMENT",
        totalAmount: c.fee,
        currency: "BDT",
        supplierCost: c.fee,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        expiresAt: new Date(Date.now() + 30 * 60_000),
        visa: {
          create: { country: c.code, visaType: body.visaType, status: "SUBMITTED", documents: body.documents ?? [] }
        }
      },
      include: { visa: true }
    });
  }

  async track(userId: string, userType: string, ref: string) {
    const b = await this.prisma.booking.findUnique({ where: { bookingRef: ref }, include: { visa: true } });
    if (!b || b.type !== "VISA") throw new NotFoundException("Visa application not found");
    if (userType !== "STAFF" && b.userId !== userId) throw new ForbiddenException();
    return b;
  }

  // ---- Admin ----
  queue(status?: string) {
    return this.prisma.booking.findMany({
      where: { type: "VISA", ...(status ? { visa: { status } } : {}) },
      include: { visa: true },
      orderBy: { createdAt: "desc" },
      take: 50
    });
  }

  setStatus(bookingId: string, status: string) {
    return this.prisma.visaApplication.update({ where: { bookingId }, data: { status } });
  }

  upsertCountry(body: { code: string; name: string; requirements: unknown; fee: number; processingDays?: number; isActive?: boolean }) {
    const { code, ...rest } = body;
    return this.prisma.visaCountry.upsert({
      where: { code },
      update: { ...(rest as any), requirements: rest.requirements as any },
      create: { code, ...(rest as any), requirements: rest.requirements as any }
    });
  }
}
