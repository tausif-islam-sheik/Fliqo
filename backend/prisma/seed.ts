import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as argon2 from "argon2";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PERMISSIONS: Array<{ key: string; module: string; description: string }> = [
  { key: "bookings.view", module: "bookings", description: "View bookings" },
  { key: "bookings.refund", module: "bookings", description: "Approve refunds" },
  { key: "bookings.ticket", module: "bookings", description: "Manual ticketing" },
  { key: "payments.view", module: "payments", description: "View transactions" },
  { key: "coupons.manage", module: "coupons", description: "Manage coupons" },
  { key: "tours.manage", module: "tours", description: "Manage tour packages" },
  { key: "campaigns.manage", module: "campaigns", description: "Manage email campaigns" },
  { key: "backups.manage", module: "backups", description: "Run backups" },
  { key: "backups.restore", module: "backups", description: "Restore backups" },
  { key: "staff.manage", module: "staff", description: "Manage staff and roles" },
  { key: "users.view", module: "users", description: "View customers" }
];

const ROLES: Array<{ name: string; description: string; isSystem: boolean; permissions: string[] | "all" }> = [
  { name: "SuperAdmin", description: "Everything including restore", isSystem: true, permissions: "all" },
  { name: "Admin", description: "Everything except restore", isSystem: false, permissions: "all" },
  { name: "Operations", description: "Bookings and ticketing", isSystem: false, permissions: ["bookings.view", "bookings.ticket"] },
  { name: "Support", description: "View bookings and customers", isSystem: false, permissions: ["bookings.view", "users.view"] },
  { name: "Finance", description: "Payments and refunds", isSystem: false, permissions: ["bookings.view", "bookings.refund", "payments.view"] },
  { name: "Marketing", description: "Coupons and campaigns", isSystem: false, permissions: ["coupons.manage", "campaigns.manage"] },
  { name: "Content", description: "Tours and CMS", isSystem: false, permissions: ["tours.manage"] }
];

async function main() {
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: {},
      create: p
    });
  }

  const allPerms = await prisma.permission.findMany();
  const permByKey = new Map(allPerms.map((p) => [p.key, p.id]));

  for (const r of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description, isSystem: r.isSystem }
    });
    const keys = r.permissions === "all" ? [...permByKey.keys()] : r.permissions;
    // SuperAdmin/Admin get everything except restore scoping handled in guards later;
    // Admin must NOT have backups.restore:
    const filtered = r.name === "Admin" ? keys.filter((k) => k !== "backups.restore") : keys;
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: filtered
        .map((k) => permByKey.get(k))
        .filter(Boolean)
        .map((permissionId) => ({ roleId: role.id, permissionId: permissionId! }))
    });
  }

  await prisma.airport.upsert({ where: { code: "DAC" }, update: { name: "Hazrat Shahjalal International Airport", city: "Dhaka" }, create: { code: "DAC", name: "Hazrat Shahjalal International Airport", city: "Dhaka", country: "BD" } });
  await prisma.airport.upsert({ where: { code: "CGP" }, update: { name: "Shah Amanat International Airport", city: "Chittagong" }, create: { code: "CGP", name: "Shah Amanat International Airport", city: "Chittagong", country: "BD" } });
  await prisma.airport.upsert({ where: { code: "CXB" }, update: { name: "Cox's Bazar Airport", city: "Cox's Bazar" }, create: { code: "CXB", name: "Cox's Bazar Airport", city: "Cox's Bazar", country: "BD" } });
  await prisma.airport.upsert({ where: { code: "JSR" }, update: { name: "Jessore Airport", city: "Jessore" }, create: { code: "JSR", name: "Jessore Airport", city: "Jessore", country: "BD" } });
  await prisma.airport.upsert({ where: { code: "SPD" }, update: { name: "Saidpur Airport", city: "Saidpur" }, create: { code: "SPD", name: "Saidpur Airport", city: "Saidpur", country: "BD" } });
  await prisma.airport.upsert({ where: { code: "ZYL" }, update: { name: "Osmani International Airport", city: "Sylhet" }, create: { code: "ZYL", name: "Osmani International Airport", city: "Sylhet", country: "BD" } });
  await prisma.airline.upsert({ where: { code: "BG" }, update: {}, create: { code: "BG", name: "Biman Bangladesh" } });
  await prisma.airline.upsert({ where: { code: "BS" }, update: {}, create: { code: "BS", name: "US-Bangla Airlines" } });
  await prisma.city.upsert({ where: { code: "DAC" }, update: {}, create: { code: "DAC", name: "Dhaka", country: "BD" } });
  await prisma.city.upsert({ where: { code: "CXB" }, update: {}, create: { code: "CXB", name: "Cox's Bazar", country: "BD" } });

  await prisma.hotel.upsert({
    where: { slug: "sea-palace-coxs-bazar" },
    update: {},
    create: {
      slug: "sea-palace-coxs-bazar",
      name: "Sea Palace Cox's Bazar",
      city: "Cox's Bazar",
      stars: 4,
      amenities: ["Pool", "WiFi", "Beach access", "Breakfast"],
      images: [],
      rooms: [
        { id: "dlx", name: "Deluxe Sea View", price: 8500 },
        { id: "std", name: "Standard", price: 5500 }
      ],
      featured: true
    }
  });
  await prisma.hotel.upsert({
    where: { slug: "dhaka-regency" },
    update: {},
    create: {
      slug: "dhaka-regency",
      name: "Dhaka Regency",
      city: "Dhaka",
      stars: 4,
      amenities: ["WiFi", "Pool", "Gym", "Restaurant"],
      images: [],
      rooms: [{ id: "dlx", name: "Deluxe", price: 7500 }]
    }
  });

  const pkg = await prisma.tourPackage.upsert({
    where: { slug: "cox-bazar-3n" },
    update: {},
    create: {
      slug: "cox-bazar-3n",
      title: "Cox's Bazar Escape — 3 Nights",
      destination: "Cox's Bazar",
      durationDays: 4,
      itinerary: { days: [{ d: 1, plan: "Arrive + beach" }, { d: 2, plan: "Himchari + Inani" }, { d: 3, plan: "St. Martin day trip" }, { d: 4, plan: "Return" }] },
      inclusions: ["Hotel", "Breakfast", "Transfers"],
      basePrice: 18500,
      images: []
    }
  });
  await prisma.tourDeparture.upsert({
    where: { id: "seed-cxb-dep-1" },
    update: {},
    create: { id: "seed-cxb-dep-1", packageId: pkg.id, startDate: new Date(Date.now() + 21 * 86_400_000), seatsTotal: 20, seatsLeft: 20, price: 18500 }
  });

  await prisma.visaCountry.upsert({
    where: { code: "THA" },
    update: {},
    create: { code: "THA", name: "Thailand", requirements: { docs: ["Passport 6mo+", "Photo", "Bank statement"], notes: "E-visa available" }, fee: 5500 }
  });
  await prisma.visaCountry.upsert({
    where: { code: "MYS" },
    update: {},
    create: { code: "MYS", name: "Malaysia", requirements: { docs: ["Passport 6mo+", "Photo", "Return ticket"], notes: "E-visa available" }, fee: 4800 }
  });

  // Dev superadmin (password: Admin@123 — change immediately)
  const email = "admin@fliqo.local";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const superAdmin = await prisma.role.findUnique({ where: { name: "SuperAdmin" } });
    await prisma.user.create({
      data: {
        email,
        name: "Fliqo Admin",
        passwordHash: await argon2.hash("Admin@123"),
        type: "STAFF",
        roleId: superAdmin?.id,
        status: "ACTIVE",
        emailVerifiedAt: new Date()
      }
    });
    console.log("Seeded dev superadmin: admin@fliqo.local / Admin@123");
  }

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
