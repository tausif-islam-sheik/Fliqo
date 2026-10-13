import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  offers() {
    return this.prisma.offer.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" } });
  }

  posts() {
    return this.prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      select: { slug: true, title: true, excerpt: true, createdAt: true }
    });
  }

  post(slug: string) {
    return this.prisma.blogPost.findFirst({ where: { slug, published: true } });
  }

  page(slug: string) {
    return this.prisma.cmsPage.findUnique({ where: { slug } });
  }

  subscribe(email: string) {
    const normalized = email.toLowerCase();
    return this.prisma.newsletterSubscriber.upsert({
      where: { email: normalized },
      update: {},
      create: { email: normalized }
    }).then(() => ({ message: "Subscribed" }));
  }

  // ---- Admin ----
  upsertOffer(body: any) {
    const { id, ...data } = body;
    if (id) return this.prisma.offer.update({ where: { id }, data });
    return this.prisma.offer.create({ data });
  }

  upsertPost(body: any) {
    const { id, ...data } = body;
    if (id) return this.prisma.blogPost.update({ where: { id }, data });
    return this.prisma.blogPost.create({ data });
  }

  upsertPage(body: { slug: string; title: string; content: string }) {
    return this.prisma.cmsPage.upsert({
      where: { slug: body.slug },
      update: { title: body.title, content: body.content },
      create: body
    });
  }
}
