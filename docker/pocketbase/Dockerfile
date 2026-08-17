# ---- Testnia PocketBase ----
# Uses the committed PocketBase Linux binary (version from apps/pocketbase/.pocketbase-version).
# Data is persisted to a named volume mounted at /data.

FROM alpine:3.20

RUN apk add --no-cache ca-certificates \
    && addgroup -S pb \
    && adduser -S pb -G pb

WORKDIR /app

COPY apps/pocketbase/pocketbase /app/pocketbase
COPY apps/pocketbase/pb_hooks /app/pb_hooks
COPY apps/pocketbase/pb_migrations /app/pb_migrations

RUN chmod +x /app/pocketbase \
    && mkdir -p /data \
    && chown -R pb:pb /app /data

USER pb

EXPOSE 8090
VOLUME ["/data"]

CMD ["/app/pocketbase", "serve", \
  "--http=0.0.0.0:8090", \
  "--encryptionEnv=PB_ENCRYPTION_KEY", \
  "--dir=/data", \
  "--migrationsDir=/app/pb_migrations", \
  "--hooksDir=/app/pb_hooks", \
  "--hooksWatch=false"]
