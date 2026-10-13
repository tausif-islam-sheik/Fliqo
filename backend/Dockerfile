# Fliqo API — persistent disk required (uploads live on server disk, PDF p.29)
FROM node:24-slim
RUN apt-get update && apt-get install -y --no-install-recommends postgresql-client-18 \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY backend/package.json backend/
COPY packages ./packages
RUN corepack enable && corepack prepare pnpm@11.8.0 --activate \
  && pnpm install --frozen-lockfile --filter @fliqo/backend... \
  && pnpm approve-builds --all && pnpm install --frozen-lockfile --filter @fliqo/backend...
COPY backend ./backend
RUN pnpm --filter @fliqo/backend build
ENV PORT=4000
EXPOSE 4000
VOLUME ["/app/backend/uploads", "/app/backend/backups"]
CMD ["node", "backend/dist/main.js"]
