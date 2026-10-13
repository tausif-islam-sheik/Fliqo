# Fliqo — Bangladesh-first OTA (GoZayaan-style)
Flat monorepo: `frontend/` (Next.js) + `backend/` (NestJS) + `packages/*`. No `apps/` folder.

## Run locally
1. Install Docker Desktop, then `docker compose up -d` (Postgres :5432, Redis :6379, Mailpit :8025/:1025).
2. `cmd /c pnpm install` (PowerShell blocks `pnpm.ps1` — always prefix with `cmd /c`).
3. `cmd /c pnpm approve-builds --all` (native deps: prisma, sharp, argon2).
4. Copy env: `backend/.env` from `.env.example`, `frontend/.env.local` from `.env.example`.
5. `prisma migrate dev` + `pnpm db:seed` (dev staff: `admin@fliqo.local / Admin@123`).
6. `cmd /c pnpm dev` — web :3000, api :4000, docs :4000/api/docs.

## Notes
- TypeScript 7.0.2 everywhere; backend compiles with `tsc` (Nest CLI needs the pre-7 compiler API).
- Mock flight supplier + mock SSLCommerz gateway — swap adapters for real credentials.
- Test a backup restore into staging monthly.
