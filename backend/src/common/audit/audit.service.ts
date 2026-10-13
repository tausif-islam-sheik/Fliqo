import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  log(actorId: string | undefined, action: string, entity: string, entityId?: string, after?: unknown) {
    return this.prisma.auditLog.create({
      data: { actorId, action, entity, entityId, after: (after ?? {}) as any }
    }).catch(() => {});
  }

  list(actorId?: string, take = 100) {
    return this.prisma.auditLog.findMany({
      where: actorId ? { actorId } : undefined,
      orderBy: { createdAt: "desc" },
      take
    });
  }
}
