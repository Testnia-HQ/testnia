# Path Substitution Audit — Horizons /hcgi → VPS

**Status:** ✅ Implemented (all code changes committed)
**Why:** Hostinger Horizons routes PocketBase and Express API under `/hcgi/platform` and `/hcgi/api`. On a plain Ubuntu VPS behind Docker, the stack runs at root paths (or explicit domains/subdomains). All Horizons-specific paths must be replaced with configurable, environment-driven URLs.

**Deployment layout (VPS):** single host with Caddy auto-HTTPS:
- Web → `https://testnia.com` / `www.testnia.com`
- PocketBase → `https://pb.testnia.com`
- Express API → `https://api.testnia.com`

---

## What changes

Current assumption: the browser and server live on the same Hostinger preview host, and the browser hits relative paths `/hcgi/platform` and `/hcgi/api`.

On VPS:
- Options:
  1. **All services on one domain** (simplest for MVP): `https://testnia.com`
    - PocketBase → `https://testnia.com/pb/` or a subdomain `pb.testnia.com`
    - Express API → `https://testnia.com/api/` or subdomain `api.testnia.com`
  2. **Subdomains** (cleaner, recommended): `pb.testnia.com`, `api.testnia.com`, `www.testnia.com` (web)
  3. **Reversed proxy** with Nginx in front of Docker, routing `/api/*` → API container, `/pb/*` → PocketBase.

For this spec we assume **Option 2 (subdomains)** with Nginx reverse proxy for web. All client code should use **environment variables** at build time, not hard-coded `/hcgi/*`.

---

## Files affected

### Client (web app)

| File | Current reference | What to change |
|---|---|---|
| `apps/web/src/lib/pocketbaseClient.js:3` | `const POCKETBASE_API_URL = '/hcgi/platform';` | Use `import.meta.env.VITE_PB_URL` (e.g. `https://pb.testnia.com`) |
| `apps/web/src/lib/apiServerClient.js:1` | `export const API_SERVER_URL = '/hcgi/api';` | Use `import.meta.env.VITE_API_URL` (e.g. `https://api.testnia.com`) |
| `apps/web/src/lib/integratedAiClient.js:1` | `const API_SERVER_URL = '/hcgi/api';` | Same as above |
| `apps/web/vite.config.js:183-184,192` | Regex `/hcgi\\/platform\\//` / `/hcgi\\/api/` used in error monkey-patch | Update patterns to use `pb.testnia.com` / `api.testnia.com` or make them configurable |
| `apps/web/.env.example` *(to be created)* | — | Add `VITE_PB_URL` and `VITE_API_URL` variables |

### Server (Express API)

| File | Current reference | What to change |
|---|---|---|
| `apps/api/src/api/integrated-ai.js:166` | `url.replace('http://localhost:8090', `https://${process.env.WEBSITE_DOMAIN}/hcgi/platform`);` | Replace with `https://${process.env.PB_HOST}/` or keep protocol-neutral rewrite |
| `apps/api/src/api/integrated-ai.js:203` | `const base = `https://${process.env.WEBSITE_DOMAIN}/hcgi/platform`;` | Use `process.env.PB_HOST` (e.g. `https://pb.testnia.com`) |
| `apps/api/.env.example` *(to be created)* | — | Add `PB_HOST`, `WEBSITE_DOMAIN`, `NODE_ENV` |

### PocketBase

| File | Current reference | What to change |
|---|---|---|
| `apps/pocketbase/pb_migrations/1759383931_initial_app_settings.js:6` | `settings.meta.appURL = "https://cbad1937-bb56-434d-a825-32adef78986b.app-preview.com/hcgi/platform"` | Should be `https://pb.testnia.com` (no `/hcgi/platform`) |
| `apps/pocketbase/pb_migrations/...` (future) | — | appURL should be set from env or deployment config, not hard-coded Horizons URL |

### Docs

| File | Current reference | What to change |
|---|---|---|
| `README.md:191-193` | Docs show Horizons paths | Update examples for VPS |
| `docs/DEPLOYMENT.md:22,130,309` | Mentions `/hcgi/platform`, `/hcgi/api` | Update to reflect new subdomains |

---

## Recommended migration plan

### Phase 1 — Make client URLs configurable

1. Create `.env.example` in `apps/web`:
   ```
   VITE_PB_URL=https://pb.testnia.com
   VITE_API_URL=https://api.testnia.com
   ```
2. Update `pocketbaseClient.js`:
   ```js
   const POCKETBASE_API_URL = import.meta.env.VITE_PB_URL || '/pb';
   ```
3. Update `apiServerClient.js` and `integratedAiClient.js` similarly.
4. Build web app with Vite env vars; in production Nginx serves static files.

### Phase 2 — Server config

1. Create `apps/api/.env.example`:
   ```
   PB_HOST=https://pb.testnia.com
   WEBSITE_DOMAIN=testnia.com
   NODE_ENV=production
   ```
2. Change `integrated-ai.js` rewrites to use `process.env.PB_HOST` and no `/hcgi` path.

### Phase 3 — PocketBase

1. Remove hard-coded appURL in migration or make it a post-deploy script; set `appURL` to `https://pb.testnia.com` at startup via `pb_hooks`.
2. Persist `pb_data` in a Docker volume: `/var/lib/pocketbase/pb_data`.

### Phase 4 — Nginx reverse proxy (optional but cleaner)

If you keep single domain `testnia.com`:
```
server {
  server_name testnia.com www.testnia.com;
  root /var/www/web/dist;
  location / {
    try_files $uri /index.html;
  }
  location /api/ {
    proxy_pass http://api:3001/;
  }
  location /pb/ {
    proxy_pass http://pocketbase:8090/;
  }
}
```

---

## Blocking items before Dockerfiles

1. ~~Confirm domain strategy (subdomains vs single domain)~~ ✅ resolved — Caddy reverse proxy with subdomains (`testnia.com`, `pb.`, `api.`)
2. ~~Confirm PB_HOST, API_HOST, WEB_HOST values~~ ✅ resolved — see `.env.example` / `.github/workflows/deploy.yml`
3. ~~Approve env-driven client URLs (VITE_*)~~ ✅ done — `VITE_PB_URL` / `VITE_API_URL`

## Delivered

- `apps/web/src/lib/{pocketbaseClient,apiServerClient,integratedAiClient}.js` — env-driven URLs
- `apps/api/src/api/integrated-ai.js` + `utils/pocketbaseClient.js` — `PB_PUBLIC_URL` / `PB_HOST`
- `apps/pocketbase/pb_migrations/1759383931_initial_app_settings.js` — env-driven `appName`/`appURL`
- `apps/pocketbase/pb_hooks/sync-app-settings.pb.js` — boot-time appURL sync for existing DBs
- `.env.example` (root), `apps/{web,api,pocketbase}/.env.example`
- `docker-compose.yml` + `docker/{web,api,pocketbase,caddy}` + `.dockerignore`
- `.github/workflows/deploy.yml` — `hostinger/deploy-on-vps@v2`

## Summary of changes count

- **3 client files** hard-code `/hcgi/platform` or `/hcgi/api` → now env-driven (Horizons fallback preserved)
- **2 server files** rewrite URLs with `/hcgi/platform` → now `PB_PUBLIC_URL`
- **1 PocketBase migration** has Horizons appURL → now env-driven (`PB_APP_NAME`/`PB_APP_URL`)
- **3+ config files** need env examples → shipped as `.env.example` per package + root
