# Testnia — Go-Live Steps (DNS + Deploy)

This doc is the end-to-end checklist to get Testnia live on the VPS. Two tasks only:
**1) add DNS records**, **2) run the deploy script in the terminal**. Estimated time: ~15 minutes.

> Prerequisites already done (verified):
> - VPS provisioned (Ubuntu 24.04, `179.198.193.127`)
> - GitHub deploy key installed on the VPS and added to the repo (`ssh -T git@github.com` works)
> - Repo has `docker-compose.yml` + `deploy/setup-vps.sh`

---

## Task 1 — Add DNS records (Hostinger hPanel)

Caddy needs **four** domains resolving to the VPS IP before it can issue SSL certificates:

| Host | Type | Value |
|------|------|-------|
| `@` (testnia.com) | A | 179.198.193.127 |
| `www` | A | 179.198.193.127 |
| `pb` | A | 179.198.193.127 |
| `api` | A | 179.198.193.127 |

### Steps

1. Log in to **https://hpanel.hostinger.com**
2. Left menu → **Domains** → click **testnia.com**
3. Click **DNS Zone** (Manage DNS records)
4. Check the current records table. Ensure all four rows above exist. Edit / add as needed:
   - Click **Add record** (or the edit icon on an existing row)
   - **Type**: `A`
   - **Name / Host**: `@` then `www` then `pb` then `api` (one record per row)
   - **Points to / Value**: `179.198.193.127`
   - **TTL**: 3600
   - Save each record
5. Wait for propagation (usually minutes; can be up to an hour).

### Verify DNS from any machine

```bash
dig +short testnia.com A
dig +short www.testnia.com A
dig +short pb.testnia.com A
dig +short api.testnia.com A
```

All four should print `179.198.193.127`. Proceed to Task 2 only when they do.

---

## Task 2 — Run the deploy script (VPS terminal)

### Open the VPS terminal

1. hPanel → **VPS** → click your VPS (`srv1909610`)
2. Click **Browser terminal** (or SSH in as root: `ssh root@179.198.193.127`)

### Run the one-shot deploy script

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/Testnia-HQ/testnia/main/deploy/setup-vps.sh)
```

The script runs entirely unattended. It will:

1. Install Docker + compose plugin (if missing)
2. Create a **2 GB swap file** (protects the 2 GB RAM box during `npm ci` / `vite build`)
3. Test GitHub SSH access with the deploy key
4. Clone `git@github.com:Testnia-HQ/testnia.git` to `/opt/testnia` (branch `main`)
5. Generate the production `.env` — including auto-created secrets:
   - `PB_ENCRYPTION_KEY` (random)
   - `PB_SUPERUSER_EMAIL` = `admin@testnia.com`
   - `PB_SUPERUSER_PASSWORD` (random)
6. Run `docker compose up -d --build` (web, api, pocketbase, caddy)
7. Wait for each container health check, then print status

### After it finishes

The script prints the **credentials** and **URLs**. Copy them somewhere safe (they are shown only once):

```
Credentials (save these):
  PB_ENCRYPTION_KEY=...
  PB_SUPERUSER_EMAIL=admin@testnia.com
  PB_SUPERUSER_PASSWORD=...
```

### Verify it's live

```bash
# Containers healthy?
cd /opt/testnia && docker compose ps

# External checks (from your laptop):
curl -I https://testnia.com
curl -I https://api.testnia.com/health
curl -I https://pb.testnia.com/api/health
```

| URL | Expected |
|-----|----------|
| https://testnia.com | 200 / 301 → web app |
| https://api.testnia.com/health | 200 JSON |
| https://pb.testnia.com/_/ | PocketBase admin login |
| https://pb.testnia.com/api/health | 200 |

---

## Troubleshooting

| Symptom | Cause / Fix |
|---------|-------------|
| `curl https://testnia.com` fails | DNS not propagated yet — re-check Task 1 |
| Caddy won't issue cert | One of the four A records missing or wrong IP |
| Container shows `unhealthy` | Run `docker compose logs <service>` to see the error |
| `GitHub SSH auth failed` | Deploy key missing — re-run the key setup in `docs/VPS_HANDOFF.md` Step 4 |
| Out of memory during build | Swap should cover it; if not, run again — second build has cached layers |

---

## Re-deploy after a new release

```bash
cd /opt/testnia
git pull origin main
docker compose --env-file .env up -d --build
```

---

## Quick ops reference

```bash
docker compose ps                          # status
docker compose logs -f --tail=100 api      # stream logs (api/web/pocketbase/caddy)
docker stats --no-stream                   # memory / CPU
docker compose restart api                 # restart one service
```