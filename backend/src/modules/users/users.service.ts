import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        type: true,
        roleId: true,
        emailVerifiedAt: true,
        marketingOptIn: true,
        createdAt: true
      }
    });
  }

  updateMe(userId: string, body: { name?: string; phone?: string; marketingOptIn?: boolean }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(body.phone ? { phone: body.phone } : {}),
        ...(typeof body.marketingOptIn === "boolean" ? { marketingOptIn: body.marketingOptIn } : {})
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        marketingOptIn: true
      }
    });
  }

  travelers(userId: string) {
    return this.prisma.traveler.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }

  addTraveler(
    userId: string,
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
    return this.prisma.traveler.create({
      data: {
        userId,
        title: body.title,
        firstName: body.firstName,
        lastName: body.lastName,
        dob: body.dob ? new Date(body.dob) : undefined,
        gender: body.gender,
        nationality: body.nationality,
        passportNo: body.passportNo,
        passportExpiry: body.passportExpiry ? new Date(body.passportExpiry) : undefined
      }
    });
  }

  async removeTraveler(userId: string, id: string) {
    const row = await this.prisma.traveler.findFirst({ where: { id, userId } });
    if (!row) throw new NotFoundException("Traveler not found");
    await this.prisma.traveler.delete({ where: { id } });
    return { message: "Removed" };
  }
}
