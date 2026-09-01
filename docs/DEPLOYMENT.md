# Deployment Guide

> **Current architecture (Aug 2026):** Frontend on **Vercel** (static SPA), backend (`api` + `pocketbase`) on **Hostinger VPS** (`179.198.193.127`) via Docker + Caddy.

- [1. Current architecture](#1-current-architecture)
- [2. Path D (ACTIVE) — Vercel frontend + VPS backend](#2-path-d-active--vercel-frontend--vps-backend)
- [3. Path A — Hostinger VPS + Docker + GitHub Actions (full stack)](#3-path-a--hostinger-vps--docker--github-actions-full-stack)
- [4. Path B — Hostinger Node.js hosting (GitHub App integration)](#4-path-b--hostinger-nodejs-hosting-github-app-integration)
- [5. Path C — Stay on Horizons (deprecated)](#5-path-c--stay-on-horizons-deprecated)
- [6. Releases & version control workflow](#6-releases--version-control-workflow)
- [7. Pre-flight checklist (before first deploy)](#7-pre-flight-checklist-before-first-deploy)
- [8. Troubleshooting](#8-troubleshooting)
- [9. Links](#9-links)

---

## 1. Current architecture

```
 Browser
   │
   ├─ <project>.vercel.app (Vercel, static SPA) ──┐
   │    VITE_PB_URL / VITE_API_URL (build-time)   │
   ├─ pb.testnia.com  ────────────────────────────┤──► VPS Caddy ──► PocketBase :8090
   └─ api.testnia.com ────────────────────────────┘──► VPS Caddy ──► Express :3001
```

| Component | Host | Deploy method |
|---|---|---|
| `apps/web` (Vite + React SPA) | **Vercel** | Auto-deploy on push to `main` |
| `apps/api` (Express 5) | **VPS** `179.198.193.127` | `docker compose up -d --build` via SSH |
| `apps/pocketbase` (PocketBase 0.39.8) | **VPS** `179.198.193.127` | Docker, `pb_data` volume |

**Frontend is TypeScript** (landing page + shadcn/ui components). Backend remains JS.

---

## 2. Path D (ACTIVE) — Vercel frontend + VPS backend

This is the **current deployment path**. Frontend deployed to Vercel; backend stays on VPS.

### Step D1 — Create Vercel project

1. Go to [vercel.com/new](https://vercel.com/new).
2. Import `Testnia-HQ/testnia` (private repo — requires GitHub App installed on org).
3. Configure:

| Setting | Value |
|---|---|
| **Root Directory** | `apps/web` |
| **Framework Preset** | Vite |
| **Node.js Version** | 22.x |
| **Build Command** | `npm run build` (auto-detected from `vercel.json`) |
| **Output Directory** | `dist` (auto-detected from `vercel.json`) |

4. Click **Deploy** — first build runs.

### Step D2 — Environment variables

In Vercel Dashboard → **Project → Settings → Environment Variables**:

| Variable | Value | Environment |
|---|---|---|
| `VITE_PB_URL` | `https://pb.testnia.com` | Production + Preview |
| `VITE_API_URL` | `https://api.testnia.com` | Production + Preview |

> **Important:** Vite bakes `VITE_*` at build time. Changing a var requires a **redeploy** to take effect.

### Step D3 — Verify the deploy

After the build completes:

```bash
# SPA loads
curl -I https://<project>.vercel.app          # 200

# Deep link refresh works (SPA rewrite)
curl -I https://<project>.vercel.app/privacy  # 200

# API reachable from frontend (check Network tab in browser)
curl -I https://api.testnia.com/health        # 200 JSON
```

### Step D4 — Custom domain (optional, deferred)

When ready to point `testnia.com` at Vercel:

1. In Vercel Dashboard → **Project → Settings → Domains** → add `testnia.com`.
2. Update DNS records:

| Host | Type | Value |
|---|---|---|
| `@` | CNAME | `cname.vercel-dns.com` |
| `www` | CNAME | `cname.vercel-dns.com` |

3. Keep `pb.testnia.com` and `api.testnia.com` pointing at VPS `179.198.193.127`.
4. Update VPS `CORS_ORIGIN` to include `https://testnia.com`.

### Step D5 — Update VPS CORS for Vercel

On the VPS:

```bash
cd /opt/testnia
# Edit .env — add Vercel preview URLs
sed -i 's|CORS_ORIGIN=.*|CORS_ORIGIN=https://testnia.com,https://www.testnia.com,https://testnia-*.vercel.app|' .env

# Restart API
docker compose up -d api
```

Or set `CORS_ORIGIN` in `.github/workflows/deploy.yml` if using GitHub Actions.

### Re-deploy after a new push

Vercel auto-deploys every push to `main`. For manual trigger:

```bash
# Via CLI
npx vercel --prod

# Or via Dashboard → Deployments → ⋯ → Redeploy
```

---

## 3. Path A — Hostinger VPS + Docker + GitHub Actions (full stack)

This runs **all three services** (web + api + pocketbase) on a VPS. Currently paused due to VPS issues — see [VPS_HANDOFF.md](VPS_HANDOFF.md).

### Step A1 — Provision / prepare the VPS

1. In hPanel → **VPS → Add a VPS** (or use an existing one).
2. Choose the **Docker** template if available (easiest), otherwise a standard OS (Ubuntu) and later `apt install docker docker-compose` + start/enable the daemon.
3. Note the **hostname**: `srv<VM_ID>.hstgr.cloud`. The **VM ID** is the number.

### Step A2 — Containerize the app

The repo is an npm-workspaces monorepo. Dockerfiles and a compose file are committed:

```
testnia/
├── docker-compose.yml
├── docker/
│   ├── web/Dockerfile
│   ├── api/Dockerfile
│   ├── pocketbase/Dockerfile
│   └── caddy/Caddyfile
├── deploy/
│   └── setup-vps.sh
```

### Step A3 — Create the Hostinger API key + find VM ID

1. hPanel → **Profile → API** → **Generate API key**. Copy it (shown once).
2. VM ID: from `srv123456.hstgr.cloud` → `123456`.

### Step A4 — Add GitHub secrets & variables

In the repo: **Settings → Secrets and variables → Actions**.

| Type | Name | Value |
|---|---|---|
| Secret | `HOSTINGER_API_KEY` | the API key from A3 |
| Secret (optional) | `PERSONAL_ACCESS_TOKEN` | GitHub PAT (needed for private repos) |
| Variable | `HOSTINGER_VM_ID` | the VM ID from A3 |

### Step A5 — Add the workflow

The workflow already exists in the repo: **`.github/workflows/deploy.yml`** (action: `hostinger/deploy-on-vps@v2`, triggers on `main` push + `v*` tags + manual).

### Step A6 — First deploy & verify

1. Commit + push the Dockerfiles, compose file, and workflow to `main`.
2. In GitHub → **Actions** tab, watch the **Deploy to Hostinger** run.
3. On the VPS: `docker compose ps` and `docker compose logs -f` to confirm all three services are up.
4. Browse the VPS IP / domain to confirm the SPA loads and the API responds (`GET /health` → `{status:"ok"}`).
5. Point your domain at the VPS (A record or via Hostinger DNS) and enable SSL (e.g. Let's Encrypt / certbot on the VPS, or a reverse proxy).

From here, **every push to `main` (and every `v*` tag) auto-redeploys**.

---

## 4. Path B — Hostinger Node.js hosting (GitHub App integration)

If you don't need a VPS yet and want GitHub deploys quickly, Hostinger's **Node.js hosting** has a native GitHub integration (GitHub App → install → build → start).

Official docs: [Node.js · GitHub](https://docs.hostinger.com/node.js/github) · [Creating a Node.js App](https://docs.hostinger.com/node.js/creating-an-app.md) · [Build Settings](https://docs.hostinger.com/node.js/build-settings.md) · [Environment Variables](https://docs.hostinger.com/node.js/environment-variables.md)

### What runs and what doesn't

| Piece | On Node.js hosting? | Notes |
|---|---|---|
| `apps/web` (Vite SPA) | ✅ static build | Framework preset: **Vite**; output dir `dist/apps/web`; see [Vite](https://docs.hostinger.com/node.js/overview-1/vite.md) / [React](https://docs.hostinger.com/node.js/overview-1/react.md) |
| `apps/api` (Express 5) | ✅ server app | Entry file `src/main.js`; see [Express](https://docs.hostinger.com/node.js/overview-1/express.md) |
| `apps/pocketbase` (Linux binary) | ❌ **cannot run** | Node.js hosting runs Node apps only. PocketBase would need a separate host (a VPS, another PaaS, or the current Horizons backend). |

### Step B1 — Add a Node.js app and connect GitHub

1. hPanel → **Websites → Add Website → Node.js web app → Import Git repository**.
2. **Connect with GitHub** → install the **Hostinger GitHub App** on your GitHub account; grant access to `Testnia-HQ/testnia`.
3. Pick the repository, confirm settings:

| Setting | Value for this repo |
|---|---|
| Framework preset | `Vite` (web) / `Other` (api) |
| Branch | `main` |
| Node.js version | `22` (matches `.nvmrc`) |
| Root directory | `apps/web` or `apps/api` (monorepo → deploy each subdir as its own app) |
| Build command | `npm install && npm run build` (web); none (api) |
| Output directory | `dist/apps/web` (web) |
| Entry file | (api) `src/main.js` |
| Env vars | set under **Environment variables** (persist across deploys) |

4. **Deploy** → first build runs. Auto-deployment is on by default: every push to `main` runs install → build → start.

> **Monorepo note:** Hostinger Node.js deploys one **root directory** per app. You'll create **two apps** (web + api), each pointing at its subdirectory. PocketBase still needs a VPS/other host — which makes Path A the better end-state.

---

## 5. Path C — Stay on Horizons (GitHub as source-of-truth only)

Use this if the team wants to keep the current live Horizons app untouched and use GitHub purely for code review/version control. There is **no auto-deploy**.

1. **Keep GitHub as the canonical source** — all development, branches, PRs, reviews, releases happen here (as they do now).
2. **Export from Horizons** when you want a snapshot: in Horizons → **export code** → download the source.
3. **Import the GitHub state into Horizons** is **not possible** (exports can't be imported back). So every Horizons edit must be manually merged back into GitHub by the engineer.
4. **Publish** to make changes live in Horizons as today.

**Recommended practice for Path C:**
- Do functional work in GitHub (via this repo), keep Horizons as the "deploy target" that the lead/editor uses.
- Treat the Horizons site as an environment you sync *to*, not a source you sync *from*.
- Document, in `docs/`, the manual sync steps so nothing is lost.

> **This does not give you releases/CI.** It only gives version control. If the goal is "releases from GitHub," choose Path A or B.

---

## 6. Releases & version control workflow

This applies once Path A (or B) is live.

### 7.1 Branch strategy

| Branch | Purpose | Auto-deploy? |
|---|---|---|
| `main` | production | ✅ (Path A/B) |
| `develop` | integration branch | optional (separate app/URL) |
| `feature/*` | PR branches | ❌ |

Recommended minimal flow:
```
feature/x → PR → develop (optional) → merge to main → auto-deploy
```

### 7.2 Cut a release (tag + GitHub Release)

```bash
# From main, after pulling latest
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

Then create the GitHub Release:

```bash
gh release create v1.0.0 \
  --title "v1.0.0" \
  --notes "What changed in this release…" \
  --generate-notes
```

With the Path A workflow, pushing the `v*` tag also triggers a deploy (the workflow triggers on `branches: [main]` and `tags: ['v*']`). GitHub Releases give you:
- Changelog per release (auto-generated from PRs/commits)
- Downloadable source archives (`.zip`/`.tar.gz`)
- A stable reference point for rollback

### 7.3 Rollback

- **Path A:** re-deploy the previous release. Either `git revert`/push a fix (clean), or from the VPS run `docker compose up --build -d` against the last known-good compose/commit. Keep `pb_data` volume so data is preserved.
- **Path B:** hPanel → **Deployments** → pick the previous build → **Redeploy**.

### 7.4 Deployment history & monitoring

- **Path A:** VPS logs (`docker compose logs -f`); GitHub **Actions** run history; add uptime monitoring (e.g. Hostinger Monitoring or a third party) hitting `GET /health`.
- **Path B:** hPanel → **Deployments** records branch, commit, status, logs per build; **Runtime Logs** for live stdout/stderr.

---

## 7. Pre-flight checklist (before first deploy)

### Vercel frontend (Path D)

- [x] **TypeScript scaffold** — `tsconfig.json`, `eslint.config.mjs` with `typescript-eslint`, `components.json` `tsx: true`
- [x] **Landing rewrite** — `HomePage.tsx`, `SiteHeader.tsx`, `Reveal.tsx`, `CountUp.tsx` with shadcn/ui components
- [x] **Asset migration** — `hero.jpg` + `logo.jpg` moved from Hostinger CDN to `/public`
- [x] **Build config** — `vercel.json` with `outputDirectory: dist/apps/web`, `rewrites` for SPA
- [x] **`|| true` removed** — `apps/web/package.json` build script fails loudly on `generate-llms.js` errors
- [x] **Horizons prod cleanup** — `addTransformIndexHtml` gated behind `isDev`
- [x] **CORS fix** — `apps/api/src/main.js` splits comma list + allows `*.vercel.app`
- [x] **Error middleware fix** — respects `err.status/err.statusCode` (not always 500)
- [ ] **Vercel env vars** — `VITE_PB_URL` and `VITE_API_URL` set in Vercel Dashboard
- [ ] **VPS CORS updated** — `CORS_ORIGIN` includes Vercel domain

### VPS backend (Path A/D)

- [ ] **`.env` provisioning** — `apps/api/.env` needs `PB_SUPERUSER_EMAIL/PASSWORD`, `INTEGRATED_AI_API_URL/KEY`, `WEBSITE_*`, `PROXY_ENTRANCE_ID`, `CORS_ORIGIN`; API exits at boot without them
- [ ] **Real Paystack key** — `PAYSTACK_SECRET_KEY` is a placeholder; demo mode lets anyone self-upgrade
- [ ] **Security fixes** — unauthenticated admin routes (`/ads/*`, `/support/admin/*`, `/payment/verify`)
- [x] ~~**Remove Horizons path coupling**~~ — web libs read `VITE_PB_URL`/`VITE_API_URL`
- [x] ~~**PocketBase**~~ — committed Linux binary, `pb_data` volume, `PB_ENCRYPTION_KEY` required

---

## 8. Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| **Vercel build fails at install** | Node version mismatch, native deps, peer conflicts | Set Node 22.x in Vercel Project Settings; check build log for first error |
| **Vercel build fails: "outDir not found"** | Output directory mismatch | Confirm `outputDirectory: dist/apps/web` in `vercel.json` or Project Settings |
| **Vercel SPA deep links 404** | Missing SPA rewrite | Confirm `rewrites` in `vercel.json` or Vercel's auto-SPA for Vite preset |
| **Frontend can't reach API/PB** | `VITE_PB_URL`/`VITE_API_URL` missing at build time | Add both in Vercel Dashboard → Env Vars (Build scope) → **Redeploy** |
| **CORS errors in browser** | VPS `CORS_ORIGIN` doesn't include Vercel domain | Update VPS `.env` `CORS_ORIGIN` to include `https://<proj>.vercel.app` → `docker compose up -d api` |
| **Preview deploy can't reach API** | Preview URL not in CORS_ORIGIN | The CORS fix in `main.js` auto-allows `*.vercel.app`; verify VPS API is running |
| **Build fails: "generate-llms.js"** | No Helmet pages found in source | Check `src/pages/*.jsx`/`*.tsx` for literal `<title>` tags; fix source |
| **No deploy triggers on push** | Branch mismatch / webhook missing / workflow filtered out | Confirm push goes to `main` (or the workflow's branch); for Path B confirm **Connected with GitHub** status on the site dashboard |
| **Workflow fails auth** | Wrong `HOSTINGER_API_KEY` or `HOSTINGER_VM_ID` | Regenerate API key; re-copy VM ID from `srv<ID>.hstgr.cloud` |
| **Private repo deploy fails** | Missing `PERSONAL_ACCESS_TOKEN` | Add PAT secret (repo scope) and pass `personal-token` |
| **Build fails at install** | Node version mismatch, native deps, peer conflicts | Set Node 22; npm auto-retries with `--legacy-peer-deps`; check first error in log |
| **Site serves old version** | Cache | Clear Hostinger cache (Path B); hard-refresh; verify container restarted (Path A) |
| **PocketBase data lost after redeploy** | `pb_data` not on a volume | Add `volumes: [pb_data:/app/pb_data]` in compose (Path A) |
| **SSH/File Manager missing on Horizons** | Horizons isn't file-based | That's expected — migrate to Path A/B/D to regain file/SSH access |
| **Domain/SSL not working** | DNS not pointed / SSL not enabled | Point A/CNAME to VPS (Path A) or use hPanel SSL (Path B) |

---

## 9. Links

- Hostinger Horizons: [technical specifications](https://www.hostinger.com/support/hostinger-horizons-technical-specifications/) · [how to export code](https://www.hostinger.com/support/10771345-hostinger-horizons-how-to-export-code/) · [hosting requirements](https://www.hostinger.com/support/hostinger-horizons-hosting-requirements/)
- Hostinger Git (not for Horizons): [how to deploy a Git repository](https://www.hostinger.com/support/1583302-how-to-deploy-a-git-repository-in-hostinger/) · [docs: Git](https://docs.hostinger.com/websites/git.md)
- Hostinger Node.js: [GitHub](https://docs.hostinger.com/node.js/github.md) · [create app](https://docs.hostinger.com/node.js/creating-an-app.md) · [build settings](https://docs.hostinger.com/node.js/build-settings.md) · [env vars](https://docs.hostinger.com/node.js/environment-variables.md) · [Express](https://docs.hostinger.com/node.js/overview-1/express.md) · [Vite](https://docs.hostinger.com/node.js/overview-1/vite.md)
- Hostinger VPS + GitHub Actions: [support article](https://www.hostinger.com/support/deploy-to-hostinger-vps-using-github-actions/) · [`hostinger/deploy-action`](https://github.com/marketplace/actions/deploy-on-hostinger-vps)
