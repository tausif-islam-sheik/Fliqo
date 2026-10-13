import { NestFactory, Reflector } from "@nestjs/core";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { EmailVerifiedGuard } from "./common/guards/email-verified.guard";
import { PrismaService } from "./prisma/prisma.service";
import { MaintenanceService } from "./common/maintenance/maintenance.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: { origin: ["http://localhost:3000"], credentials: true }
  });
  app.use(helmet());
  app.use(cookieParser());
  app.setGlobalPrefix("api/v1");

  // Email verification gate for booking/payment routes (registered in later phases)
  const reflector = app.get(Reflector);
  const prisma = app.get(PrismaService);
  app.useGlobalGuards(new EmailVerifiedGuard(reflector, prisma));

  // Restore maintenance mode: block writes while a restore runs (PDF p.19)
  const maintenance = app.get(MaintenanceService, { strict: false });
  app.use((req: any, res: any, next: any) => {
    if (
      maintenance.active &&
      req.method !== "GET" &&
      /^\/(api\/v1\/)?(bookings|payments)\//.test(req.path)
    ) {
      return res.status(503).json({ error: { code: "MAINTENANCE", message: "Restore in progress, try again shortly" } });
    }
    next();
  });

  const config = new DocumentBuilder()
    .setTitle("Fliqo API")
    .setDescription("Bangladesh-first OTA API")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, doc);

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
