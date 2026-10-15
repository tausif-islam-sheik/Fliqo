import "dotenv/config";
import { defineConfig } from "prisma/config";

// Fallback URL lets `prisma generate` run in CI/Docker builds where
// DATABASE_URL isn't set yet (generate doesn't need a live DB).
const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://localhost:5432/fliqo";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: databaseUrl }
});
