# ---- Testnia API: Express server ----
# Context = repo root. Env is injected by docker-compose (never baked in).

FROM node:22-alpine AS deps
WORKDIR /repo

COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/pocketbase/package.json apps/pocketbase/package.json

RUN npm ci

FROM node:22-alpine AS runtime
WORKDIR /repo

ENV NODE_ENV=production

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/package.json ./package.json
COPY --from=deps /repo/package-lock.json ./package-lock.json
COPY apps/api ./apps/api

WORKDIR /repo/apps/api

EXPOSE 3001
CMD ["node", "src/main.js"]
