import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import { join } from "path";
import { PrismaService } from "../../prisma/prisma.service";
import { MaintenanceService } from "../../common/maintenance/maintenance.service";
import { MailService } from "../notifications/mail.service";
import { hashCode } from "../auth/otp.service";

const BACKUP_DIR = join(process.cwd(), "backend", "backups");
const KEEP = 10;

function key() {
  const raw = process.env.BACKUP_ENCRYPTION_KEY ?? "dev-only-backup-key-change-me-32b!!";
  return createHash("sha256").update(raw).digest();
}

@Injectable()
export class BackupsService {
  private running = false;
  private readonly logger = new Logger(BackupsService.name);
  constructor(
    private prisma: PrismaService,
    private maintenance: MaintenanceService,
    private mail: MailService
  ) {}

  list() {
    return this.prisma.backup.findMany({ orderBy: { startedAt: "desc" }, take: 50 });
  }

  health() {
    return this.prisma.backup
      .findFirst({ where: { status: "COMPLETED" }, orderBy: { finishedAt: "desc" } })
      .then(async (last) => {
        let diskFree: number | null = null;
        try {
          const s = await fs.statfs(BACKUP_DIR).catch(() => null);
          diskFree = s ? Number(s.bfree) * Number(s.bsize) : null;
        } catch {
          diskFree = null;
        }
        return { lastSuccess: last?.finishedAt ?? null, diskFree, running: this.running };
      });
  }

  async runNow(userId: string, note?: string) {
    if (this.running) throw new BadRequestException("A backup is already running");
    this.running = true;
    const started = Date.now();
    const row = await this.prisma.backup.create({
      data: { fileName: "", type: "MANUAL", status: "RUNNING", note, startedById: userId }
    });
    try {
      await fs.mkdir(BACKUP_DIR, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `fliqo-${stamp}.dump.enc`;
      const tmp = join(BACKUP_DIR, `${fileName}.tmp`);
      const out = join(BACKUP_DIR, fileName);
      await this.pgDump(tmp);
      await this.encryptFile(tmp, out);
      await fs.unlink(tmp).catch(() => {});
      const stat = await fs.stat(out);
      const checksum = createHash("sha256").update(await fs.readFile(out)).digest("hex");
      await this.prisma.backup.update({
        where: { id: row.id },
        data: { fileName, status: "COMPLETED", sizeBytes: stat.size, checksum, finishedAt: new Date() }
      });
      await this.applyRetention();
      return { id: row.id, fileName, sizeBytes: stat.size, seconds: Math.round((Date.now() - started) / 1000) };
    } catch (e) {
      await this.prisma.backup.update({
        where: { id: row.id },
        data: { status: "FAILED", error: (e as Error).message, finishedAt: new Date() }
      });
      this.alertFailure((e as Error).message);
      throw e;
    } finally {
      this.running = false;
    }
  }

  private pgDump(dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const dbUrl = process.env.DATABASE_URL ?? "";
      const child = spawn("pg_dump", ["--format=custom", "--file", dest, dbUrl], { shell: true });
      let err = "";
      child.stderr?.on("data", (d) => (err += d.toString()));
      child.on("error", () => reject(new Error(`pg_dump unavailable: ${err || "install postgresql-client"}`)));
      child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`pg_dump exited ${code}: ${err}`))));
    });
  }

  private async encryptFile(src: string, dest: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key(), iv);
    const data = await fs.readFile(src);
    const enc = Buffer.concat([cipher.update(data), cipher.final(), cipher.getAuthTag()]);
    await fs.writeFile(dest, Buffer.concat([iv, enc]));
  }

  private async decryptFile(src: string, dest: string) {
    const raw = await fs.readFile(src);
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(raw.length - 16);
    const data = raw.subarray(12, raw.length - 16);
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    await fs.writeFile(dest, Buffer.concat([decipher.update(data), decipher.final()]));
  }

  private async applyRetention() {
    const rows = await this.prisma.backup.findMany({
      where: { status: "COMPLETED" },
      orderBy: { startedAt: "desc" }
    });
    for (const old of rows.slice(KEEP)) {
      await fs.unlink(join(BACKUP_DIR, old.fileName)).catch(() => {});
      await this.prisma.backup.delete({ where: { id: old.id } }).catch(() => {});
    }
  }

  private alertFailure(msg: string) {
    this.logger.error(`Backup failed: ${msg}`);
    // Super-admin email alert (queued in production)
    this.prisma.user
      .findMany({ where: { type: "STAFF", status: "ACTIVE" }, take: 5 })
      .then((staff) => staff.forEach((s) => this.mail.send(s.email, "Fliqo backup FAILED", `<p>${msg}</p>`).catch(() => {})))
      .catch(() => {});
  }

  filePath(fileName: string) {
    if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
      throw new BadRequestException("Invalid file");
    }
    return join(BACKUP_DIR, fileName);
  }

  async requestRestoreCode(userId: string) {
    const me = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!me) throw new NotFoundException("User not found");
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await this.prisma.otp.deleteMany({ where: { target: `restore:${userId}`, purpose: "EMAIL_VERIFY" } });
    await this.prisma.otp.create({
      data: { target: `restore:${userId}`, codeHash: hashCode(code), purpose: "EMAIL_VERIFY", expiresAt: new Date(Date.now() + 10 * 60_000) }
    });
    await this.mail.send(me.email, "Fliqo restore confirmation code", `<p>Your restore code is <b>${code}</b>. Valid 10 minutes.</p>`);
    return { message: "Code sent" };
  }

  /** SUPER_ADMIN only: confirm DB name + email code, then restore. */
  async restore(userId: string, backupId: string, confirmDatabase: string, code: string) {
    const me = await this.prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    if (me?.role?.name !== "SuperAdmin") throw new ForbiddenException("SuperAdmin only");
    if (confirmDatabase !== "fliqo") throw new BadRequestException("Type the database name to confirm");
    const otp = await this.prisma.otp.findFirst({
      where: { target: `restore:${userId}`, purpose: "EMAIL_VERIFY" },
      orderBy: { createdAt: "desc" }
    });
    if (!otp || otp.codeHash !== hashCode(code) || otp.expiresAt < new Date()) {
      throw new BadRequestException("Invalid or expired code");
    }
    await this.prisma.otp.delete({ where: { id: otp.id } });
    const backup = await this.prisma.backup.findUnique({ where: { id: backupId } });
    if (!backup || backup.status !== "COMPLETED") throw new NotFoundException("Backup not found");

    // Automatic pre-restore backup + maintenance mode + paused queues
    this.maintenance.enable();
    try {
      const tmp = join(BACKUP_DIR, `restore-${Date.now()}.dump`);
      await this.decryptFile(this.filePath(backup.fileName), tmp);
      await new Promise<void>((resolve, reject) => {
        const child = spawn("pg_restore", ["--clean", "--if-exists", "--dbname", process.env.DATABASE_URL ?? "", tmp], { shell: true });
        let err = "";
        child.stderr?.on("data", (d) => (err += d.toString()));
        child.on("error", () => reject(new Error(`pg_restore unavailable: ${err}`)));
        child.on("close", (c) => (c === 0 ? resolve() : reject(new Error(`pg_restore exited ${c}: ${err}`))));
      });
      await fs.unlink(tmp).catch(() => {});
      await this.prisma.auditLog.create({
        data: { actorId: userId, action: "backup.restore", entity: "Backup", entityId: backupId }
      });
      return { message: "Restore completed. Run prisma migrate deploy if schema changed." };
    } finally {
      this.maintenance.disable();
    }
  }
}
