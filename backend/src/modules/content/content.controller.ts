import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ContentService } from "./content.service";
import { Public } from "../../common/decorators/public.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";

@Controller()
export class ContentController {
  constructor(private content: ContentService) {}

  @Public()
  @Get("offers")
  offers() {
    return this.content.offers();
  }

  @Public()
  @Get("blog")
  posts() {
    return this.content.posts();
  }

  @Public()
  @Get("blog/:slug")
  post(@Param("slug") slug: string) {
    return this.content.post(slug);
  }

  @Public()
  @Get("pages/:slug")
  page(@Param("slug") slug: string) {
    return this.content.page(slug);
  }

  @Public()
  @Post("newsletter/subscribe")
  subscribe(@Body() body: { email: string }) {
    return this.content.subscribe(body.email);
  }

  @Post("admin/offers")
  @RequirePermissions("campaigns.manage")
  upsertOffer(@Body() body: any) {
    return this.content.upsertOffer(body);
  }

  @Post("admin/blog")
  @RequirePermissions("campaigns.manage")
  upsertPost(@Body() body: any) {
    return this.content.upsertPost(body);
  }

  @Post("admin/pages")
  @RequirePermissions("campaigns.manage")
  upsertPage(@Body() body: any) {
    return this.content.upsertPage(body);
  }
}
