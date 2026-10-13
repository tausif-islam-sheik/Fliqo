import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async kpis(from?: string, to?: string) {
    const gte = from ? new Date(from) : new Date(Date.now() - 30 * 86_400_000);
    const lte = to ? new Date(to) : new Date();
    const [bookings, revenue, users, refunds, failed] = await Promise.all([
      this.prisma.booking.count({ where: { createdAt: { gte, lte } } }),
      this.prisma.booking.aggregate({
        where: { createdAt: { gte, lte }, status: { in: ["PAID", "TICKETING", "CONFIRMED"] } },
        _sum: { totalAmount: true }
      }),
      this.prisma.user.count({ where: { createdAt: { gte, lte }, type: "CUSTOMER" } }),
      this.prisma.refund.aggregate({ where: { createdAt: { gte, lte } }, _sum: { amount: true }, _count: true }),
      this.prisma.payment.count({ where: { createdAt: { gte, lte }, status: "FAILED" } })
    ]);
    const searches = await this.prisma.analyticsEvent.count({ where: { type: "SEARCH", createdAt: { gte, lte } } });
    return {
      revenue: Number(revenue._sum.totalAmount ?? 0),
      bookings,
      conversion: searches ? bookings / searches : 0,
      newUsers: users,
      refunds: { amount: Number(refunds._sum.amount ?? 0), count: refunds._count },
      failedPayments: failed
    };
  }

  async chart(name: string, from?: string, to?: string) {
    const gte = from ? new Date(from) : new Date(Date.now() - 30 * 86_400_000);
    const lte = to ? new Date(to) : new Date();
    switch (name) {
      case "bookings-by-product": {
        const rows = await this.prisma.booking.groupBy({
          by: ["type"],
          where: { createdAt: { gte, lte } },
          _count: true
        });
        return rows.map((r) => ({ name: r.type, value: r._count }));
      }
      case "revenue-by-product": {
        const rows = await this.prisma.booking.groupBy({
          by: ["type"],
          where: { createdAt: { gte, lte }, status: { in: ["PAID", "TICKETING", "CONFIRMED"] } },
          _sum: { totalAmount: true }
        });
        return rows.map((r) => ({ name: r.type, value: Number(r._sum.totalAmount ?? 0) }));
      }
      case "booking-status": {
        const rows = await this.prisma.booking.groupBy({
          by: ["status"],
          where: { createdAt: { gte, lte } },
          _count: true
        });
        return rows.map((r) => ({ name: r.status, value: r._count }));
      }
      case "funnel": {
        const [searches, checkouts, paid, ticketed] = await Promise.all([
          this.prisma.analyticsEvent.count({ where: { type: "SEARCH", createdAt: { gte, lte } } }),
          this.prisma.analyticsEvent.count({ where: { type: "START_CHECKOUT", createdAt: { gte, lte } } }),
          this.prisma.analyticsEvent.count({ where: { type: "PAID", createdAt: { gte, lte } } }),
          this.prisma.analyticsEvent.count({ where: { type: "TICKETED", createdAt: { gte, lte } } })
        ]);
        return [
          { name: "Searches", value: searches },
          { name: "Started checkout", value: checkouts },
          { name: "Paid", value: paid },
          { name: "Ticketed", value: ticketed }
        ];
      }
      case "revenue-daily": {
        const rows = await this.prisma.$queryRaw<Array<{ d: string; revenue: number }>>`
          SELECT to_char("createdAt", 'YYYY-MM-DD') AS d, COALESCE(SUM("totalAmount"),0)::float AS revenue
          FROM "Booking" WHERE "createdAt" BETWEEN ${gte} AND ${lte}
          AND status IN ('PAID','TICKETING','CONFIRMED')
          GROUP BY d ORDER BY d`;
        return rows;
      }
      default:
        return [];
    }
  }

  bookings(status?: string, type?: string) {
    return this.prisma.booking.findMany({
      where: { ...(status ? { status: status as any } : {}), ...(type ? { type: type as any } : {}) },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { flight: true, hotel: true, tour: true, visa: true, payments: true }
    });
  }

  users(q?: string) {
    return this.prisma.user.findMany({
      where: q ? { OR: [{ email: { contains: q } }, { name: { contains: q } }] } : undefined,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, email: true, name: true, type: true, status: true, emailVerifiedAt: true, createdAt: true }
    });
  }

  needsAction() {
    return this.prisma.booking.findMany({
      where: { status: { in: ["TICKETING_FAILED", "PENDING_PAYMENT"] } },
      orderBy: { createdAt: "desc" },
      take: 20
    });
  }
}
