import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CurrentUser, RequestUser } from "../../common/decorators/current-user.decorator";

@Controller("users")
export class UsersController {
  constructor(private users: UsersService) {}

  @Get("me")
  me(@CurrentUser() user: RequestUser) {
    return this.users.me(user.sub);
  }

  @Patch("me")
  updateMe(
    @CurrentUser() user: RequestUser,
    @Body() body: { name?: string; phone?: string; marketingOptIn?: boolean }
  ) {
    return this.users.updateMe(user.sub, body);
  }

  @Get("me/travelers")
  travelers(@CurrentUser() user: RequestUser) {
    return this.users.travelers(user.sub);
  }

  @Post("me/travelers")
  addTraveler(
    @CurrentUser() user: RequestUser,
    @Body()
    body: {
      title?: string;
      firstName: string;
      lastName: string;
      dob?: string;
      gender?: string;
      nationality?: string;
      passportNo?: string;
      passportExpiry?: string;
    }
  ) {
    return this.users.addTraveler(user.sub, body);
  }

  @Delete("me/travelers/:id")
  removeTraveler(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.users.removeTraveler(user.sub, id);
  }
}
