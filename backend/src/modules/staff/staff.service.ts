import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { createHash, randomBytes } from "crypto";
import * as argon2 from "argon2";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../../common/audit/audit.service";
import { MailService } from "../notifications/mail.service";

@Injectable()
export class StaffService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private mail: MailService
  ) {}

  staff() {
    return this.prisma.user.findMany({
      where: { type: "STAFF" },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, name: true, status: true, roleId: true, role: true, twoFactorEnabled: true, lastLoginAt: true, createdAt: true }
    });
  }

  invites() {
    return this.prisma.staffInvite.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  }

  async invite(actorId: string, body: { email: string; name: string; roleId: string }) {
    const role = await this.prisma.role.findUnique({ where: { id: body.roleId } });
    if (!role) throw new BadRequestException("Unknown role");
    const token = randomBytes(32).toString("hex");
    const invite = await this.prisma.staffInvite.create({
      data: {
        email: body.email.toLowerCase(),
        name: body.name,
        roleId: role.id,
        tokenHash: createHash("sha256").update(token).digest("hex"),
        expiresAt: new Date(Date.now() + 48 * 3600_000),
        invitedById: actorId
      }
    });
    const web = process.env.WEB_URL ?? "http://localhost:3000";
    await this.mail
      .send(body.email, "You're invited to Fliqo staff", `<p><a href="${web}/admin/accept-invite?token=${token}">Accept invite</a> (48h)</p>`)
      .catch(() => {});
    await this.audit.log(actorId, "staff.invite", "StaffInvite", invite.id, { email: body.email, role: role.name });
    return { id: invite.id, devToken: process.env.NODE_ENV === "production" ? undefined : token };
  }

  async accept(body: { token: string; password: string }) {
    const hash = createHash("sha256").update(body.token).digest("hex");
    const invite = await this.prisma.staffInvite.findUnique({ where: { tokenHash: hash } });
    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      throw new BadRequestException("Invalid or expired invite");
    }
    const existing = await this.prisma.user.findUnique({ where: { email: invite.email } });
    if (existing) throw new BadRequestException("Email already registered");
    const user = await this.prisma.user.create({
      data: {
        email: invite.email,
        name: invite.name,
        passwordHash: await argon2.hash(body.password),
        type: "STAFF",
        roleId: invite.roleId,
        emailVerifiedAt: new Date(),
        twoFactorEnabled: true
      }
    });
    await this.prisma.staffInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
    await this.audit.log(user.id, "staff.accept", "User", user.id, { email: user.email });
    return { message: "Account active. Verify the emailed 2FA code at login." };
  }

  async setRole(actorId: string, userId: string, roleId: string) {
    if (actorId === userId) throw new ForbiddenException("You cannot change your own role");
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    if (!user || user.type !== "STAFF") throw new NotFoundException("Staff not found");
    if (user.role?.name === "SuperAdmin") {
      const supers = await this.prisma.user.count({
        where: { type: "STAFF", status: "ACTIVE", role: { name: "SuperAdmin" } }
      });
      if (supers <= 1) throw new ForbiddenException("Cannot remove the last SuperAdmin");
    }
    const updated = await this.prisma.user.update({ where: { id: userId }, data: { roleId } });
    await this.prisma.refreshToken.updateMany({ where: { userId }, data: { revokedAt: new Date() } });
    await this.audit.log(actorId, "staff.role", "User", userId, { roleId });
    return { id: updated.id, roleId: updated.roleId };
  }

  async suspend(actorId: string, userId: string, suspend: boolean) {
    if (actorId === userId) throw new ForbiddenException("You cannot suspend yourself");
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: suspend ? "SUSPENDED" : "ACTIVE" }
    });
    if (suspend) {
      await this.prisma.refreshToken.updateMany({ where: { userId }, data: { revokedAt: new Date() } });
    }
    await this.audit.log(actorId, suspend ? "staff.suspend" : "staff.reactivate", "User", userId, {});
    return { message: suspend ? "Suspended" : "Reactivated" };
  }

  async forceLogout(actorId: string, userId: string) {
    await this.prisma.refreshToken.updateMany({ where: { userId }, data: { revokedAt: new Date() } });
    await this.audit.log(actorId, "staff.force-logout", "User", userId, {});
    return { message: "All sessions revoked" };
  }

  roles() {
    return this.prisma.role.findMany({ include: { permissions: { include: { permission: true } } } });
  }

  permissions() {
    return this.prisma.permission.findMany({ orderBy: [{ module: "asc" }, { key: "asc" }] });
  }

  async saveRole(actorId: string, body: { id?: string; name: string; description?: string; permissionKeys: string[] }) {
    if (body.id) {
      const role = await this.prisma.role.findUnique({ where: { id: body.id } });
      if (role?.isSystem) throw new ForbiddenException("System roles cannot be edited");
      const perms = await this.prisma.permission.findMany({ where: { key: { in: body.permissionKeys } } });
      await this.prisma.rolePermission.deleteMany({ where: { roleId: body.id } });
      await this.prisma.rolePermission.createMany({
        data: perms.map((p) => ({ roleId: body.id!, permissionId: p.id }))
      });
      const updated = await this.prisma.role.update({ where: { id: body.id }, data: { name: body.name, description: body.description } });
      await this.audit.log(actorId, "role.update", "Role", body.id, { name: body.name });
      return updated;
    }
    const perms = await this.prisma.permission.findMany({ where: { key: { in: body.permissionKeys } } });
    const created = await this.prisma.role.create({
      data: {
        name: body.name,
        description: body.description,
        permissions: { create: perms.map((p) => ({ permissionId: p.id })) }
      }
    });
    await this.audit.log(actorId, "role.create", "Role", created.id, { name: body.name });
    return created;
  }

  activity(actorId?: string) {
    return this.prisma.auditLog.findMany({
      where: actorId ? { actorId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200
    });
  }
}
