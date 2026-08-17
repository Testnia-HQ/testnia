# ---- Testnia web: multi-stage build (Node -> nginx static) ----
# Context = repo root.

FROM node:22-alpine AS build
WORKDIR /repo

ARG VITE_PB_URL=https://pb.testnia.com
ARG VITE_API_URL=https://api.testnia.com

COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/pocketbase/package.json apps/pocketbase/package.json

RUN npm ci

COPY apps/web ./apps/web

RUN printf "VITE_PB_URL=%s\nVITE_API_URL=%s\n" "$VITE_PB_URL" "$VITE_API_URL" > apps/web/.env \
    && npm run build --prefix apps/web

FROM nginx:1.27-alpine AS runtime
COPY --from=build /repo/dist/apps/web /usr/share/nginx/html
COPY docker/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
