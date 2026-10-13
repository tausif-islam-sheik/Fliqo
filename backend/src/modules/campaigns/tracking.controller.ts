import { Controller, Get, Param, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import { PrismaService } from "../../prisma/prisma.service";
import { Public } from "../../common/decorators/public.decorator";

const PIXEL = Buffer.from("R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==", "base64");

@Public()
@Controller("t")
export class TrackingController {
  constructor(private prisma: PrismaService) {}

  @Get("o/:recipientId")
  async open(@Param("recipientId") id: string, @Res() res: Response) {
    await this.prisma.emailEvent.create({ data: { recipientId: id, type: "OPENED" } }).catch(() => {});
    await this.prisma.campaignRecipient.update({ where: { id }, data: { openedAt: new Date() } }).catch(() => {});
    res.setHeader("Content-Type", "image/gif");
    res.send(PIXEL);
  }

  @Get("c/:recipientId")
  async click(@Param("recipientId") id: string, @Query("url") url: string, @Res() res: Response) {
    await this.prisma.emailEvent.create({ data: { recipientId: id, type: "CLICKED", url } }).catch(() => {});
    res.redirect(url || "/");
  }

  @Get("unsubscribe/:recipientId")
  async unsubscribe(@Param("recipientId") id: string, @Res() res: Response) {
    const r = await this.prisma.campaignRecipient.findUnique({ where: { id } });
    if (r) {
      await this.prisma.emailSuppression.upsert({
        where: { email: r.email },
        update: { reason: "UNSUBSCRIBED" },
        create: { email: r.email, reason: "UNSUBSCRIBED" }
      }).catch(() => {});
      await this.prisma.user.updateMany({ where: { email: r.email }, data: { marketingOptIn: false } }).catch(() => {});
    }
    res.send("Unsubscribed. You will no longer receive marketing emails from Fliqo.");
  }
}
