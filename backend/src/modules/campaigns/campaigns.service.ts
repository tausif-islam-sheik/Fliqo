import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { MailService } from "../notifications/mail.service";

export interface Segment {
  product?: "FLIGHT" | "HOTEL" | "TOUR" | "VISA";
  newsletterOnly?: boolean;
}

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);
  constructor(
    private prisma: PrismaService,
    private mail: MailService
  ) {}

  list() {
    return this.prisma.campaign.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  }

  create(body: { name: string; subject: string; htmlBody: string; segment?: Segment }) {
    return this.prisma.campaign.create({
      data: {
        name: body.name,
        segment: (body.segment ?? {}) as any,
        template: {
          create: {
            name: body.name,
            key: `campaign-${Date.now()}`,
            subject: body.subject,
            content: { html: body.htmlBody } as any
          }
        }
      }
    });
  }

  report(id: string) {
    return this.prisma.campaign.findUnique({
      where: { id },
      include: { recipients: { take: 20, orderBy: { createdAt: "desc" } } }
    });
  }

  /**
   * Build recipients (skip suppressed + non-opted-in) then send in batches
   * of 100 with provider rate-limit in mind. Transactional mail uses a
   * separate queue/subdomain in production so campaigns never delay OTPs.
   */
  async start(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { template: true }
    });
    if (!campaign) throw new NotFoundException("Campaign not found");
    if (!["DRAFT", "PAUSED"].includes(campaign.status)) {
      throw new BadRequestException(`Cannot start campaign in ${campaign.status}`);
    }
    const segment = (campaign.segment ?? {}) as Segment;
    const suppressed = new Set((await this.prisma.emailSuppression.findMany()).map((s) => s.email));

    const users = await this.prisma.user.findMany({
      where: {
        marketingOptIn: true,
        emailVerifiedAt: { not: null },
        ...(segment.product ? { bookings: { some: { type: segment.product } } } : {})
      },
      select: { id: true, email: true, name: true }
    });
    const subs = segment.newsletterOnly
      ? []
      : await this.prisma.newsletterSubscriber.findMany().catch(() => []);
    const seen = new Set<string>();
    const targets: Array<{ userId?: string; email: string; name: string }> = [];
    for (const u of users) {
      if (suppressed.has(u.email) || seen.has(u.email)) continue;
      seen.add(u.email);
      targets.push({ userId: u.id, email: u.email, name: u.name });
    }
    for (const s of subs ?? []) {
      if (suppressed.has(s.email) || seen.has(s.email)) continue;
      seen.add(s.email);
      targets.push({ email: s.email, name: "traveler" });
    }

    await this.prisma.campaignRecipient.createMany({
      data: targets.map((t) => ({ campaignId: id, userId: t.userId, email: t.email, status: "QUEUED" as const }))
    });
    await this.prisma.campaign.update({
      where: { id },
      data: { status: "SENDING", scheduledAt: new Date() }
    });

    // Fire-and-forget sender with batching; counters reconciled at the end.
    this.sendBatches(id).catch((e) => this.logger.error(`Campaign ${id} failed: ${(e as Error).message}`));
    return { queued: targets.length };
  }

  private async sendBatches(campaignId: string) {
    const web = process.env.WEB_URL ?? "http://localhost:3000";
    for (;;) {
      const batch = await this.prisma.campaignRecipient.findMany({
        where: { campaignId, status: "QUEUED" },
        take: 100
      });
      if (batch.length === 0) break;
      for (const r of batch) {
        try {
          const campaign = await this.prisma.campaign.findUnique({
            where: { id: campaignId },
            include: { template: true }
          });
          const subject = campaign?.template?.subject ?? "News from Fliqo";
          const raw = ((campaign?.template?.content as any)?.html as string) ?? "<p>Hello from Fliqo</p>";
          const html =
            `${raw.replaceAll("{{name}}", r.email.split("@")[0])}` +
            `<img src="${web}/api/v1/t/o/${r.id}" width="1" height="1" alt="" />` +
            `<p><a href="${web}/api/v1/t/unsubscribe/${r.id}">Unsubscribe</a></p>`;
          const providerMessageId = await this.mail.send(r.email, subject, html, {
            "List-Unsubscribe": `<${web}/api/v1/t/unsubscribe/${r.id}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
          });
          await this.prisma.campaignRecipient.update({
            where: { id: r.id },
            data: { status: "SENT", providerMessageId }
          });
        } catch {
          await this.prisma.campaignRecipient.update({ where: { id: r.id }, data: { status: "FAILED" } });
        }
      }
    }
    const [sent, opened, clicked, bounced] = await Promise.all([
      this.prisma.campaignRecipient.count({ where: { campaignId, status: "SENT" } }),
      this.prisma.emailEvent.count({ where: { recipient: { campaignId }, type: "OPENED" } }),
      this.prisma.emailEvent.count({ where: { recipient: { campaignId }, type: "CLICKED" } }),
      this.prisma.emailEvent.count({ where: { recipient: { campaignId }, type: "BOUNCED" } })
    ]);
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "SENT", sentAt: new Date(), sent, opened, clicked, bounced }
    });
  }

  async pause(id: string) {
    return this.prisma.campaign.update({ where: { id }, data: { status: "PAUSED" } });
  }

  async testSend(id: string, email: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id }, include: { template: true } });
    if (!campaign?.template) throw new NotFoundException("Campaign not found");
    const html = ((campaign.template.content as any)?.html as string) ?? "";
    await this.mail.send(email, `[TEST] ${campaign.template.subject}`, html);
    return { message: "Test sent" };
  }
}
