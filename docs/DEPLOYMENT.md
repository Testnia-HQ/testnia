# GitHub ↔ Hostinger Connection & Release Guide

> **TL;DR:** The Testnia codebase was built inside **Hostinger Horizons**, and **Hostinger Horizons does not support Git/GitHub integration**. You cannot point this GitHub repo at the Horizons-hosted app for auto-deploy. To get "version control + releases with GitHub", the app must move onto a GitHub-connected Hostinger platform. **This guide's recommended path is a Hostinger VPS + Docker + GitHub Actions**, which can run the full stack (web + api + PocketBase).

- [1. The situation — why this matters](#1-the-situation--why-this-matters)
- [2. Step 0 — What do you currently have? (check first)](#2-step-0--what-do-you-currently-have-check-first)
- [3. Decision — pick your deployment target](#3-decision--pick-your-deployment-target)
- [4. Path A (RECOMMENDED) — Hostinger VPS + Docker + GitHub Actions](#4-path-a-recommended--hostinger-vps--docker--github-actions)
- [5. Path B — Hostinger Node.js hosting (GitHub App integration)](#5-path-b--hostinger-nodejs-hosting-github-app-integration)
- [6. Path C — Stay on Horizons (GitHub as source-of-truth only)](#6-path-c--stay-on-horizons-github-as-source-of-truth-only)
- [7. Releases & version control workflow](#7-releases--version-control-workflow)
- [8. Pre-flight checklist (before first deploy)](#8-pre-flight-checklist-before-first-deploy)
- [9. Troubleshooting](#9-troubleshooting)
- [10. Links](#10-links)

---

## 1. The situation — why this matters

The repo (`github.com/Testnia-HQ/testnia`) contains an app that was **created inside Hostinger Horizons** (Hostinger's AI app-builder). Evidence in the code:

- PocketBase is served under `/hcgi/platform` and the Express API under `/hcgi/api` (Horizons URL scheme).
- The live app is set to `https://cbad1937-bb56-434d-a825-32adef78986b.app-preview.com` (a Horizons preview domain).
- Horizons visual-editor/iframe/auth plugins ship inside `apps/web/plugins/` and `vite.config.js`.
- Assets come from `horizons-cdn.hostinger.com` / `images.hostinger.com`.

### The blocker

Per Hostinger's official documentation:

| Doc | Quote |
|---|---|
| [Horizons: Technical specifications](https://www.hostinger.com/support/hostinger-horizons-technical-specifications/) | *"direct code imports from platforms like GitHub are not supported"*; *"FTP, File Manager, SFTP, and SSH are not supported"*; exported code *"is turned into a static website, and cannot be imported back to Horizons"* |
| [How to deploy a Git repository in Hostinger](https://www.hostinger.com/support/1583302-how-to-deploy-a-git-repository-in-hostinger/) | *"Hostinger Horizons and Hostinger Website Builder websites do not support Git integration."* |

**Meaning:** There is no switch in Horizons to "connect GitHub" and no way to have pushes to GitHub deploy to the Horizons app. Version control with GitHub must be driven from **outside** Horizons.

> ⚠️ **Team decision required.** The business lead should confirm: are we migrating the app off Horizons (Path A or B), or keeping Horizons as the live host (Path C)? Everything below depends on that answer. Path A is the recommended end state because it is the only one that runs the **entire** stack (web + Express API + PocketBase binary) with real CI/CD.

---

## 2. Step 0 — What do you currently have? (check first)

Log in to [hPanel](https://hpanel.hostinger.com) and inspect what's in the account before choosing a path.

1. **Websites tab** (`hpanel.hostinger.com/websites`)
   - Each entry is a "website". Open **Dashboard** on each.
   - If a site's dashboard has a **Horizons** label / opens the Horizons AI editor, that site is a **Horizons app** (this is where Testnia lives today).
   - If a site shows a normal hosting dashboard with **Advanced → Git**, **Node.js**, or **File Manager**, it's a regular shared/web or Node.js hosting plan.
2. **VPS tab** (`hpanel.hostinger.com/vps`)
   - Lists any Virtual Private Servers (hostname like `srv123456.hstgr.cloud`).
   - Note the **VM ID** (the digits in `srv<ID>.hstgr.cloud`) — needed for Path A.
   - Check the OS template: is it the **Docker** template, or plain OS?
3. **Billing / Orders** (`hpanel.hostinger.com/billing`)
   - Confirms which paid products exist: Horizons subscription, hosting plans, VPS, domains.
4. **Profile → API** (`hpanel.hostinger.com/profile/api`)
   - Where you create the Hostinger API token used by GitHub Actions (Path A).

**Decision table based on what you find:**

| What you find | Recommended action |
|---|---|
| Horizons app + its bundled hosting only | Migrate to a VPS (Path A) or Node.js plan (Path B) for real CI/CD, or keep Horizons as-is (Path C) |
| A VPS exists (any OS) | Use Path A; install Docker on it if not using the Docker template |
| A Node.js hosting plan exists | Path B works for web + api (PocketBase still needs a home — see §5) |
| Only domains/email | Need to purchase a VPS or Node.js plan to proceed with Path A/B |

---

## 3. Decision — pick your deployment target

| | **Path A — VPS + Docker + GitHub Actions** | **Path B — Node.js hosting (GitHub App)** | **Path C — stay on Horizons** |
|---|---|---|---|
| **Runs full stack?** | ✅ web + api + PocketBase (all in Docker) | ⚠️ web (static) + api (Express) only; PocketBase binary cannot run on Node.js hosting | ⚠️ Horizons runs it, but only as its own managed app |
| **GitHub connection** | GitHub Actions workflow → Hostinger API | Native GitHub App: push → install → build → restart | ❌ none (no Git support) |
| **Auto-deploy on push** | ✅ (via workflow) | ✅ (native webhook) | ❌ manual export/publish |
| **Releases/tags deploy** | ✅ (workflow triggers on tags) | ⚠️ tag = branch push; no dedicated release trigger | ❌ |
| **Effort** | Higher (Dockerfiles, compose, workflow) but one-time | Lower for web+api | Lowest, but no CI/CD |
| **Best for** | **Production end-state (recommended)** | Quick win for frontend/API split | Keeping the current live site untouched |

---

## 4. Path A (RECOMMENDED) — Hostinger VPS + Docker + GitHub Actions

Official action: [`hostinger/deploy-action`](https://github.com/marketplace/actions/deploy-on-hostinger-vps) (also [`hostinger/deploy-on-vps`](https://github.com/hostinger/deploy-on-vps)). It deploys **Docker Compose** apps to a Hostinger VPS.

### Step A1 — Provision / prepare the VPS

1. In hPanel → **VPS → Add a VPS** (or use an existing one).
2. Choose the **Docker** template if available (easiest), otherwise a standard OS (Ubuntu) and later `apt install docker docker-compose` + start/enable the daemon.
3. Note the **hostname**: `srv<VM_ID>.hstgr.cloud`. The **VM ID** is the number.

### Step A2 — Containerize the app

The repo is an npm-workspaces monorepo. Dockerfiles and a compose file are **not committed yet** — this is part of the refactor (see §8). Sketch:

```
testnia/
├── docker/
│   └── docker-compose.yml
├── apps/
│   ├── web/Dockerfile        # multi-stage: build Vite SPA → serve (nginx or `vite preview`)
│   ├── api/Dockerfile        # npm install at apps/api → `node --env-file=.env src/main.js`
│   └── pocketbase/Dockerfile # FROM alpine → download pocketbase Linux binary → ./pocketbase serve
```

`docker-compose.yml` (illustrative — final version is part of the refactor):

```yaml
services:
  pocketbase:
    build: ../apps/pocketbase
    ports: ["8090:8090"]
    env_file: ../apps/pocketbase/.env
    volumes: [pb_data:/app/pb_data]
  api:
    build: ../apps/api
    ports: ["3001:3001"]
    env_file: ../apps/api/.env
    depends_on: [pocketbase]
  web:
    build: ../apps/web
    ports: ["80:80"]   # or serve behind the VPS IP / domain
    depends_on: [api]
volumes:
  pb_data:
```

> **Deployment-specific changes still needed** (track in §8 / GitHub issues):
> - Replace Horizons-specific routing (`/hcgi/platform`, `/hcgi/api`) with plain `/`-rooted URLs (web libs `pocketbaseClient.js`, `apiServerClient.js`, `integratedAiClient.js`).
> - Provide `apps/pocketbase/.env` (`PB_ENCRYPTION_KEY`, superuser creds, mailer vars).
> - Provide `apps/api/.env` (`PB_SUPERUSER_*`, `INTEGRATED_AI_*`, `WEBSITE_*`, `CORS_ORIGIN`, real Paystack key).
> - Persist `pb_data` in a volume so PocketBase data survives redeploys.

> ✅ **Done as of the VPS setup (see commit history / `docs/VPS_HANDOFF.md`):** the Docker stack is now in the repo —
> - `docker-compose.yml` (root) + `docker/web|api|pocketbase|caddy/Dockerfile` (Caddy gives auto-HTTPS for `testnia.com`, `pb.`, `api.`)
> - `/hcgi/*` URL coupling removed — web reads `VITE_PB_URL` / `VITE_API_URL`, API reads `PB_HOST` / `PB_PUBLIC_URL` (see `.env.example` and `docs/PATH_SUBSTITUTIONS.md`)
> - PocketBase appURL is env-driven (`PB_APP_URL`) via migration + `pb_hooks/sync-app-settings.pb.js`
> - Workflow `.github/workflows/deploy.yml` (correct action: `hostinger/deploy-on-vps@v2`)
> - Root `.env.example` documents every secret/variable the stack needs

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

The workflow already exists in the repo: **`.github/workflows/deploy.yml`** (action: `hostinger/deploy-on-vps@v2`, triggers on `main` push + `v*` tags + manual). It is ready to run as soon as the secrets below exist:

```yaml
name: Deploy to Hostinger VPS
on:
  push:
    branches: [main]
    tags: ['v*']
  workflow_dispatch:
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Hostinger
        uses: hostinger/deploy-on-vps@v2
        with:
          api-key: ${{ secrets.HOSTINGER_API_KEY }}
          virtual-machine: ${{ vars.HOSTINGER_VM_ID }}
          project-name: testnia
          personal-token: ${{ secrets.PERSONAL_ACCESS_TOKEN }}
          docker-compose-path: docker-compose.yml
          environment-variables: |
            VITE_PB_URL=${{ vars.VITE_PB_URL }}
            VITE_API_URL=${{ vars.VITE_API_URL }}
            PB_APP_URL=${{ vars.PB_APP_URL }}
            PB_PUBLIC_URL=${{ vars.PB_PUBLIC_URL }}
            CORS_ORIGIN=${{ vars.CORS_ORIGIN }}
            PB_ENCRYPTION_KEY=${{ secrets.PB_ENCRYPTION_KEY }}
            PB_SUPERUSER_EMAIL=${{ secrets.PB_SUPERUSER_EMAIL }}
            ...
```

> `personal-token` is required for **private repositories** (this repo is private). Set all GitHub **variables** (public URLs) and **secrets** (keys/credentials) per §8's env checklist; the exact list is in `docs/VPS_HANDOFF.md` and the workflow itself.

### Step A6 — First deploy & verify

1. Commit + push the Dockerfiles, compose file, and workflow to `main`.
2. In GitHub → **Actions** tab, watch the **Deploy to Hostinger** run.
3. On the VPS: `docker compose ps` and `docker compose logs -f` to confirm all three services are up.
4. Browse the VPS IP / domain to confirm the SPA loads and the API responds (`GET /health` → `{status:"ok"}`).
5. Point your domain at the VPS (A record or via Hostinger DNS) and enable SSL (e.g. Let's Encrypt / certbot on the VPS, or a reverse proxy).

From here, **every push to `main` (and every `v*` tag) auto-redeploys**.

---

## 5. Path B — Hostinger Node.js hosting (GitHub App integration)

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

## 6. Path C — Stay on Horizons (GitHub as source-of-truth only)

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

## 7. Releases & version control workflow

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

## 8. Pre-flight checklist (before first deploy)

Fix these first — they come from the codebase review (README §9) and will break a deploy:

- [ ] **`.env` provisioning** — `apps/api/.env` is missing `PB_SUPERUSER_EMAIL/PASSWORD`, `INTEGRATED_AI_API_URL/KEY`, `WEBSITE_*`, `PROXY_ENTRANCE_ID`, `CORS_ORIGIN`; API calls `process.exit(1)` at boot without them. On the VPS these are injected via GitHub secrets/variables into compose (see `.env.example`).
- [ ] **Real Paystack key** — `PAYSTACK_SECRET_KEY` is a placeholder; demo mode lets anyone self-upgrade. Do not deploy with it.
- [ ] **Security fixes** — unauthenticated admin routes (`/ads/*`, `/support/admin/*`, `/payment/verify`) must be locked down before production.
- [ ] ~~**Remove Horizons path coupling**~~ ✅ **done** — web libs read `VITE_PB_URL`/`VITE_API_URL`; API reads `PB_HOST`/`PB_PUBLIC_URL` (see `docs/PATH_SUBSTITUTIONS.md`).
- [ ] **Build script** — `apps/web` build uses `|| true` masking `generate-llms.js` failures; fix so deploys fail loudly.
- [ ] ~~**PocketBase**~~ ✅ **done** — committed Linux binary is used by `docker/pocketbase/Dockerfile`, data persisted in the `pb_data` volume, `PB_ENCRYPTION_KEY` required via env.
- [ ] **Secrets hygiene** — confirm `*.env` stays gitignored; use CI secrets / VPS env for all credentials (GitHub secrets + variables already wired in the workflow).
- [ ] **CORS** — set `CORS_ORIGIN` to the real domain (it's empty → denies all browsers); must be a GitHub **variable** named `CORS_ORIGIN`.

> 🛠️ These are already tracked as roadmap items in `README.md` (Phase 1 — Security; Phase 2 — Reliability). Do not attempt a production deploy before Phase 1 is complete.

> 🛠️ These are already tracked as roadmap items in `README.md` (Phase 1 — Security; Phase 2 — Reliability). Do not attempt a production deploy before Phase 1 is complete.

---

## 9. Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| **No deploy triggers on push** | Branch mismatch / webhook missing / workflow filtered out | Confirm push goes to `main` (or the workflow's branch); for Path B confirm **Connected with GitHub** status on the site dashboard |
| **Workflow fails auth** | Wrong `HOSTINGER_API_KEY` or `HOSTINGER_VM_ID` | Regenerate API key; re-copy VM ID from `srv<ID>.hstgr.cloud` |
| **Private repo deploy fails** | Missing `PERSONAL_ACCESS_TOKEN` | Add PAT secret (repo scope) and pass `personal-token` |
| **Build fails at install** | Node version mismatch, native deps, peer conflicts | Set Node 22; npm auto-retries with `--legacy-peer-deps`; check first error in log |
| **Site serves old version** | Cache | Clear Hostinger cache (Path B); hard-refresh; verify container restarted (Path A) |
| **`Could not access repository` (Path B, URL deploy)** | Used public-URL deploy on a private repo | Connect the owning GitHub account instead of pasting a URL |
| **PocketBase data lost after redeploy** | `pb_data` not on a volume | Add `volumes: [pb_data:/app/pb_data]` in compose (Path A) |
| **SSH/File Manager missing on Horizons** | Horizons isn't file-based | That's expected — migrate to Path A/B to regain file/SSH access |
| **Domain/SSL not working** | DNS not pointed / SSL not enabled | Point A/CNAME to VPS (Path A) or use hPanel SSL (Path B) |

---

## 10. Links

- Hostinger Horizons: [technical specifications](https://www.hostinger.com/support/hostinger-horizons-technical-specifications/) · [how to export code](https://www.hostinger.com/support/10771345-hostinger-horizons-how-to-export-code/) · [hosting requirements](https://www.hostinger.com/support/hostinger-horizons-hosting-requirements/)
- Hostinger Git (not for Horizons): [how to deploy a Git repository](https://www.hostinger.com/support/1583302-how-to-deploy-a-git-repository-in-hostinger/) · [docs: Git](https://docs.hostinger.com/websites/git.md)
- Hostinger Node.js: [GitHub](https://docs.hostinger.com/node.js/github.md) · [create app](https://docs.hostinger.com/node.js/creating-an-app.md) · [build settings](https://docs.hostinger.com/node.js/build-settings.md) · [env vars](https://docs.hostinger.com/node.js/environment-variables.md) · [Express](https://docs.hostinger.com/node.js/overview-1/express.md) · [Vite](https://docs.hostinger.com/node.js/overview-1/vite.md)
- Hostinger VPS + GitHub Actions: [support article](https://www.hostinger.com/support/deploy-to-hostinger-vps-using-github-actions/) · [`hostinger/deploy-action`](https://github.com/marketplace/actions/deploy-on-hostinger-vps)
