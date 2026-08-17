# Testnia

> **Exam preparation platform** — WAEC / JAMB / GCE / NECO / KCSE focus, with English & French support.

A three-app npm-workspaces monorepo: a Vite + React SPA (`apps/web`), an Express 5 API (`apps/api`), and a PocketBase backend with JS hooks and migrations (`apps/pocketbase`).

---

## ⚠️ WARNING — READ THIS FIRST

### 🔧 Major refactoring in progress — expect a long ride

This codebase was shipped to a live environment before it was production-ready. A **large amount of refactoring, architectural rework, and cleanup is planned and will take time**. The current structure, patterns, and implementation details must **NOT** be treated as final or as reference material.

- Do **not** build new features on top of existing broken patterns without confirming with the team first.
- Expect significant changes to: authentication & authorization, the API surface, the PocketBase schema, state management, and deployment.
- If you are new to this repo, read this whole document before touching anything — especially the **"What is not right"** sections below.

### 💳 DeepSeek API subscription required

The AI engineer needs access to a **DeepSeek API platform subscription** (a paid key) as soon as possible:

1. **Development** — a good assistant model for day-to-day development work.
2. **In-app AI features** — the app has real AI features that already depend on this API and **will not work without it**:
   - **Integrated AI chat** (SSE streaming chat with image upload)
   - **Essay grading** (`POST /grade-essay`)
   - **Study goal generation** (`POST /generate-goal`)

Configuration lives in `apps/api/.env`:

| Variable | Purpose |
|---|---|
| `INTEGRATED_AI_API_URL` | DeepSeek-compatible API base URL |
| `INTEGRATED_AI_API_KEY` | DeepSeek API key (paid subscription) |
| `X-Proxy-Entrance-Id` (via `PROXY_ENTRANCE_ID`) | Sent with AI requests |

> **Business lead / owner action needed:** provision the DeepSeek subscription and provide the key + endpoint to the AI engineer. This is a blocker for the AI features and for efficient development.

---

## Table of contents

1. [Overview](#1-overview)
2. [Tech stack](#2-tech-stack)
3. [Repository structure & monorepo approach](#3-repository-structure--monorepo-approach)
4. [Hosting — Hostinger / Horizons](#4-hosting--hostinger--horizons)
5. [Setup & running locally](#5-setup--running-locally)
6. [Environment variables](#6-environment-variables)
7. [Data model (PocketBase collections)](#7-data-model-pocketbase-collections)
8. [API surface](#8-api-surface)
9. [What is NOT right — issues log](#9-what-is-not-right--issues-log)
   - 9.1 Critical (security)
   - 9.2 High (bugs, dead code, build)
   - 9.3 Medium (quality, hygiene)
   - 9.4 Snapshot drift (`app.tar.gz` vs working tree)
10. [Prioritized roadmap](#10-prioritized-roadmap)

## Docs

| Doc | What it covers |
|---|---|
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Step-by-step guide to connecting GitHub to Hostinger (VPS + GitHub Actions recommended, Node.js hosting, stay-on-Horizons), plus releases & version-control workflow |
| [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md) | The Testnia MVP product specification (v1.0 consolidated, decision log included) |
| [`docs/VPS_HANDOFF.md`](docs/VPS_HANDOFF.md) | Checklist for the business lead: get VM ID + Hostinger API key + DNS, hand off to engineer |
| [`docs/PATH_SUBSTITUTIONS.md`](docs/PATH_SUBSTITUTIONS.md) | Horizons `/hcgi/*` → VPS URL audit and the env-driven fixes implemented in code |

---

## 1. Overview

| Aspect | Value |
|---|---|
| Product | Testnia — exam prep platform (WAEC/JAMB/GCE/NECO/KCSE) |
| Languages | English (`en`), French (`fr`) via i18next |
| Frontend | SPA — React 18, Vite 7, react-router 7, Tailwind 3, shadcn/ui (Radix) |
| Backend | PocketBase 0.39.8 + JS hooks + migrations |
| API | Express 5 (Node 22 ESM) — payments, AI, ads, support, leaderboard |
| Node | `.nvmrc` = `22` |
| Build/deploy tooling | Hostinger Horizons (visual-editor plugins baked into the frontend) |
| Package manager | npm workspaces |

---

## 2. Tech stack

### `apps/web` — frontend SPA

- **React 18.3** + `react-dom`, **Vite 7** build tool
- **react-router-dom 7** (BrowserRouter) — see routes in `src/App.jsx`
- **Tailwind CSS 3.4** + `tailwindcss-animate` + shadcn-style CSS-variable theme (`darkMode: ['class']`)
- **~30 `@radix-ui/*` primitives**, `class-variance-authority`, `clsx`, `tailwind-merge` (shadcn new-york style, JS not TS)
- **State**: React Context only — `AuthContext` (`pb.authStore`), `LocaleContext` (country/language, synced to user record)
- **Data**: `pocketbase@0.27.1` SDK (direct) + a thin `fetch` wrapper for the Express API
- **i18n**: `i18next` + `react-i18next` (`src/i18n/en.json`, `fr.json` — 16 sections each)
- **UI extras**: `recharts` (dashboard charts), `framer-motion`, `sonner` (toasts), `lucide-react`, `react-hook-form` + `zod`, `react-helmet`
- **SEO**: `robots.txt`, `sitemap.xml`, `public/llms.txt` (generated)

### `apps/api` — Express 5 API (ESM)

- `express@^5`, `helmet`, `cors`, `express-rate-limit`, `morgan`, `multer` (memory + magic-byte file validation)
- `pocketbase@0.27.1` SDK (superuser client)
- Endpoints: payments (Paystack), AI (stream/grade/goal), ads, support, leaderboard, health

### `apps/pocketbase` — PocketBase 0.39.8

- Single binary committed in-repo (**Linux x86-64 ELF**)
- `pb_hooks/` — 8 JS hooks (emails, freemium subscription, migrations command, external dashboard, logs)
- `pb_migrations/` — 16 migration files defining the full schema + seed data
- `pb_data/` — committed local data (see issues), includes generated `types.d.ts`

---

## 3. Repository structure & monorepo approach

```
testnia/
├── .nvmrc                  # Node 22
├── .version                # 25
├── package.json            # npm workspaces root — dev/build/start/lint orchestration
├── package-lock.json
├── app.tar.gz              # 12.2 MB snapshot artifact — see §9.4 (drift!)
├── apps/
│   ├── web/                # Vite + React 18 SPA (port 3000)
│   │   ├── index.html
│   │   ├── vite.config.js  # dev plugins (Horizons editor tooling)
│   │   ├── tailwind.config.js
│   │   ├── components.json # shadcn config
│   │   ├── jsconfig.json   # "@/*" → "./src/*"
│   │   ├── eslint.config.mjs  (+ unicode-escapes plugin/formatter)
│   │   ├── public/         # robots.txt, sitemap.xml
│   │   ├── plugins/        # Horizons visual-editor/iframe/auth/site-pages/session-journal
│   │   ├── tools/          # generate-llms.js (llms.txt generator)
│   │   └── src/
│   │       ├── App.jsx     # router + providers + layout
│   │       ├── main.jsx
│   │       ├── i18n/       # index.js, en.json, fr.json
│   │       ├── contexts/   # AuthContext, LocaleContext
│   │       ├── hooks/      # use-integrated-ai, useSubscription, use-toast, ...
│   │       ├── lib/        # pocketbaseClient, apiServerClient, integratedAiClient, ...
│   │       ├── pages/      # Home, Auth, Dashboard, Onboarding, Upgrade, PaymentCallback,
│   │       │               # Practice (Exams/PracticeSession/Essay/Leaderboard), Admin, Legal
│   │       └── components/ # SiteHeader, ChatWidget, AdBanner, ... + ui/ (55+ shadcn)
│   ├── api/                # Express 5 API (port 3001)
│   │   ├── package.json
│   │   ├── .env            # config (placeholder Paystack key!) — see §6
│   │   └── src/
│   │       ├── main.js     # bootstrap (helmet, cors, rate limit, routes, error)
│   │       ├── routes/     # integrated-ai, payment, ads, support, leaderboard, index
│   │       ├── middleware/ # pocketbase-auth, error, file-upload, rate limits
│   │       ├── api/        # integrated-ai (PB image upload, history)
│   │       ├── utils/      # pocketbaseClient, aiGenerate
│   │       └── constants/  # common, prompts
│   └── pocketbase/         # PocketBase 0.39.8
│       ├── pocketbase      # Linux binary — WILL NOT RUN ON WINDOWS natively
│       ├── package.json    # serve + migrations:up/revert/snapshot/update scripts
│       ├── pb_hooks/       # 8 JS hooks (see §7)
│       ├── pb_migrations/  # 16 migrations
│       └── pb_data/        # data.db, auxiliary.db, types.d.ts, .notify/
```

### Approach / conventions in use

- **npm workspaces** (`"workspaces": ["apps/*"]`) — single root install, per-app scripts.
- Root orchestration via `concurrently`:

| Script | Runs | Notes |
|---|---|---|
| `npm run setup` | `npm install` | |
| `npm run dev` | web (3000) + api (3001) + pocketbase (8090) | `--kill-others` — one failure kills all |
| `npm run build` | **web only** | `generate-llms.js || true` masks failures (see §9.2) |
| `npm run start` | api + pocketbase | **web is NOT started** (see §9.2) |
| `npm run lint` | web + api | |

- **No TypeScript** (frontend is JSX with `jsconfig.json` aliasing).
- **No test suite**, **no CI**, **no Docker**, **no README (until now)**, **no `.gitignore` (until now)**.
- **No Git history** was provided — this import starts fresh (see §10, step 0).

### What's good (to preserve)

- Clean separation of web / api / pocketbase into workspaces.
- Complete, chronological PocketBase migrations with sensible collection rules and rate limits.
- i18n parity between `en.json` and `fr.json` (16 identical top-level sections).
- Security-conscious pieces already present: helmet, CORS, global rate limit, magic-byte file validation, token-signed image URLs (90s TTL).
- Hooks are small and focused (emails, freemium subscription, logs).

---

## 4. Hosting — Hostinger / Horizons

The app is **built and deployed via Hostinger Horizons** (Hostinger's AI visual-editor platform). This has major implications:

- **Live preview / app URL**: `https://cbad1937-bb56-434d-a825-32adef78986b.app-preview.com` (set as `appName`/`appURL` in `pb_migrations/1759383931_initial_app_settings.js`)
- **Path routing** (Horizons): PocketBase served under `/hcgi/platform` and the Express API under `/hcgi/api`. **Now env-configurable for VPS** — the client libs fall back to `/hcgi/*` when unset but are driven by `VITE_PB_URL` / `VITE_API_URL` (see `.env.example`), and the API uses `PB_HOST` / `PB_PUBLIC_URL`:
  - `apps/web/src/lib/pocketbaseClient.js` → `import.meta.env.VITE_PB_URL || '/hcgi/platform'`
  - `apps/web/src/lib/apiServerClient.js` → `import.meta.env.VITE_API_URL || '/hcgi/api'`
  - `apps/api/src/api/integrated-ai.js` rewrites PB URLs using `PB_PUBLIC_URL` (falls back to `WEBSITE_DOMAIN/hcgi/platform`)
- **Frontend integration plugins** (all `apply: 'serve'` — dev only): inline edit, selection mode, iframe route restoration, site-pages scan, pocketbase auth bridge, session journal, and a runtime error/navigation guard injected into `index.html`.
- **Allowed editor origins**: `horizons.hostinger.com`, `horizons.hostinger.dev`, `horizons-frontend-local.hostinger.dev`; dev hosts allow `.app-preview.com` / `.app-preview.io`.
- **Hostinger CDNs** are used for assets: hero image (`images.hostinger.com`), logo (`horizons-cdn.hostinger.com`), and the PB admin dashboard is proxied from `horizons-static-cdn.hostinger.com/.../ui/dist/index.html` (`pb_hooks/external-dashboard.pb.js`).
- **Docker deployment (VPS)** — a self-contained Docker stack now ships in this repo (`docker-compose.yml` + `docker/`), deployable to a Hostinger VPS via GitHub Actions (`hostinger/deploy-on-vps@v2`, see `.github/workflows/deploy.yml`). No deployment manifest existed before.

> ⚠️ Because hosting config lives on Hostinger's side, changes here (ports, paths, environment) must be mirrored there. Keep `WEBSITE_*`/`appURL`/`PB_*` in sync.
>
> **Important:** Horizons does **not** support Git/GitHub integration, so this repo cannot auto-deploy to the Horizons-hosted app. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the full migration + GitHub connection guide and [`docs/VPS_HANDOFF.md`](docs/VPS_HANDOFF.md) for the business-lead checklist (VM ID + API key + DNS).

---

## 5. Setup & running locally

> **⚠️ Windows note:** `apps/pocketbase/pocketbase` is a **Linux x86-64 binary** — it **will not run natively on Windows**. The root `npm run dev` / `npm run start` launch PocketBase and will fail on a Windows host. Use **WSL2** or a **container** for full local dev, or swap in a Windows PB binary (see §10).

```bash
# 0. Use Node 22 (see .nvmrc)
nvm use

# 1. Install dependencies
npm install

# 2. Configure apps/api/.env (see §6) — WITHOUT it the API exits at startup

# 3. Run everything (web + api + pocketbase)
npm run dev
```

Individual apps:

```bash
npm run dev --prefix apps/web          # http://localhost:3000
npm run dev --prefix apps/api          # http://localhost:3001
npm run dev --prefix apps/pocketbase   # http://localhost:8090
```

PocketBase maintenance:

```bash
npm run migrations:up    --prefix apps/pocketbase
npm run migrations:revert --prefix apps/pocketbase
npm run migrations:snapshot --prefix apps/pocketbase
npm run update --prefix apps/pocketbase
```

---

## 6. Environment variables

### `apps/api/.env` — CURRENT STATE (broken)

Only **3 variables** exist, and two are problems:

```
PORT=3001
CORS_ORIGIN=              # EMPTY → API CORS denies ALL browser origins
PAYSTACK_SECRET_KEY=sk_test_REPLACE_WITH_YOUR_PAYSTACK_SECRET_KEY   # PLACEHOLDER
```

**Missing variables** (all referenced by code — the API **exits immediately** at boot without them):

| Variable | Used by | Required |
|---|---|---|
| `PB_SUPERUSER_EMAIL` | `utils/pocketbaseClient.js` | Yes |
| `PB_SUPERUSER_PASSWORD` | `utils/pocketbaseClient.js` | Yes |
| `INTEGRATED_AI_API_URL` | `utils/aiGenerate.js` | Yes |
| `INTEGRATED_AI_API_KEY` | `utils/aiGenerate.js` | Yes |
| `WEBSITE_ID` | integrated-ai | Yes |
| `WEBSITE_URL` | integrated-ai | Yes |
| `WEBSITE_DOMAIN` | integrated-ai (URL rewrites) | Yes |
| `PROXY_ENTRANCE_ID` | `utils/aiGenerate.js` (header `X-Proxy-Entrance-Id`) | Yes |
| `NODE_ENV` | env detection | Yes |

> `utils/pocketbaseClient.js` performs superuser auth at startup and calls `process.exit(1)` if it fails — so a misconfigured `.env` makes the whole API crash.

### PocketBase env (referenced by hooks/migrations)

- `PB_ENCRYPTION_KEY` (serve flag `--encryptionEnv=PB_ENCRYPTION_KEY`)
- `PB_SUPERUSER_EMAIL` / `PB_SUPERUSER_PASSWORD` (superuser creation migration)
- `BUILDER_MAILER_API_URL` / `BUILDER_MAILER_API_KEY` / `BUILDER_MAILER_SENDER_ADDRESS` (mailer hook, when SMTP disabled)

---

## 7. Data model (PocketBase collections)

Defined by `pb_migrations/` (chronological). Final schema (tutorial collections were added then dropped):

| Collection | Purpose / notes |
|---|---|
| `users` | PB auth collection + `full_name`, `country`, `language` |
| `profiles` | Learning profile — `target_subjects`, `learning_goal` |
| `exams` | Exam catalogue (waec/jamb/gce/neco/kcse/ielts/sat/gmat seeded) |
| `subjects` | Subjects |
| `exam_subjects` | Exam↔subject join (unique pair, weight, typical_question_count, core) |
| `questions` | Practice questions (seeded) |
| `practice_sessions` | Session records (started by dashboard — see orphan bug §9.2) |
| `essay_submissions` | Essay grading results |
| `subscriptions` | Plans: `free` (auto on signup via hook) / `pro` / `starter` / `tutor`; `status`, `current_period_end`, `auto_renew`, `start_date` |
| `payments` | Paystack transactions |
| `ads` | Ad placements (3 seeded placeholders) |
| `ad_impressions` | Impression counter |
| `support_tickets` | Support tickets (`resolved_at`) |
| `ticket_messages` | Ticket conversation threads |
| `admin_users` | Admin allow-list (see §9.1 — rules are `null`, effectively broken) |
| `_integratedAiMessages` | AI chat history (owner rules) |
| `_integratedAiImages` | AI chat images (20 MB, jpg/png/webp, protected, viewRule auth) |

**Rate limits configured** (`1769164585_set_rate_limits.js`): `/api` 200/5min; auth 20/5min (guests); password-reset 5/hr; verification 5/hr; email-change 3/hr; OTP 10/hr.

### `pb_hooks/` summary

| Hook | What it does |
|---|---|
| `welcome-email.pb.js` | EN/FR welcome email on user create |
| `users-send-verification.pb.js` | Verification email after create |
| `create-freemium-subscription.pb.js` | Auto-creates free/active subscription on signup |
| `payment-confirmation-email.pb.js` | Email on pro/starter/tutor + active |
| `builder-mailer.pb.js` | Routes mail through builder API when SMTP disabled |
| `custom-migrations-cmd.pb.js` | `horizons migrations:up` / `migrations:revert` commands |
| `external-dashboard.pb.js` | Proxies PB admin UI from Hostinger CDN |
| `logs-forwarder.pb.js` | Prod: logs to stdout; dev: session journal file |

---

## 8. API surface

Express API (`apps/api/src/routes/index.js`), base `/hcgi/api` (client) / port 3001 (local):

| Method & path | Auth | Notes |
|---|---|---|
| `GET /health` | none | `{status:'ok'}` |
| `POST /integrated-ai/stream` | PB auth + 10/min | SSE stream; ≤5 images (magic-byte validated); pipes to client + saves history |
| `GET /payment/pricing` | none | NG ₦2,999 / GH GH₵35 / KE KSh450 / GB,US,AE $5.99 |
| `POST /payment/initiate` | **none** | Paystack init; demo mode when key is placeholder |
| `POST /payment/verify` | **none** | Activates pro for arbitrary `userId`; demo mode skips Paystack |
| `GET /leaderboard` | none | score ≥ 90% + completed; opt-out → Anonymous |
| `POST /grade-essay` | PB auth | AI rubric grading → `essay_submissions` |
| `POST /generate-goal` | PB auth | AI study plan → `profiles.learning_goal` |
| `GET /ads` | none | public; `placement` filter (string-concatenated query — see §9.3) |
| `POST /ads/impression` | none | increments counter |
| `GET /ads/all` | **none** | full ad list |
| `POST /ads` | **none** | create ad |
| `PATCH /ads/:id` | **none** | update ad |
| `DELETE /ads/:id` | **none** | delete ad |
| `GET /support/admin/tickets*` | **none** | list ALL tickets incl. user emails |
| `POST/PATCH /support/admin/tickets*` | **none** | reply as admin, change status |

---

## 9. What is NOT right — issues log

This is the full log of everything found during the initial codebase review (Aug 2026). Items are grouped by severity. **This list is the source of truth for the roadmap (§10).**

### 9.1 Critical — security

| # | Issue | Where | Impact / fix direction |
|---|---|---|---|
| C1 | **No authentication on admin APIs** — `ads` and `support` routes expose full admin CRUD with zero auth. Anyone can list **all support tickets including user emails**, reply as admin, change ticket status, and create/modify/delete ads. | `apps/api/src/routes/ads.js`, `apps/api/src/routes/support.js` | Require PB superuser/admin auth on all `/ads/*` (non-public) and `/support/admin/*` routes. |
| C2 | **Pro subscription can be activated for any `userId`** — `POST /payment/verify` activates a pro subscription for an arbitrary userId, and with the placeholder Paystack key it never talks to Paystack at all (demo mode). Anyone can self-upgrade. | `apps/api/src/routes/payment.js` | Only verify against real Paystack transactions for the authenticated user; remove demo-mode bypass in production. |
| C3 | **`admin_users` check is dead** — the web UI checks `pb.collection('admin_users').getFirstListItem(...)` but the collection rules are all `null`, so non-superuser SDK reads always throw. Result: `isAdmin` is always false and admin pages are unusable even for authorized staff. | `apps/web/src/components/SiteHeader.jsx`, `apps/web/src/pages/AdminSupportPage.jsx` + migration for `admin_users` | Set proper view/list rules on `admin_users` (or use a different, safe mechanism), and **always enforce authorization server-side** (see C1). |
| C4 | **Error middleware discards HTTP status codes** — always responds `500`, so 401/403/422 become 500 and clients can't distinguish auth failures. | `apps/api/src/middleware/error.js` | Respect `err.status` / `err.statusCode`. |

### 9.2 High — bugs, dead code, build & run

| # | Issue | Where |
|---|---|---|
| H1 | **Dead AI chat UI** — a full integrated AI chat component (with hook, API, and PB collections) exists but is **never imported/mounted**. `ChatWidget` is only an FAQ/support widget. The AI chat feature is built but invisible. | `apps/web/src/components/integrated-ai-chat.jsx`, `hooks/use-integrated-ai.jsx` |
| H2 | **Dead SEO component** — `Seo.jsx` is never imported; pages use react-helmet directly. | `apps/web/src/components/Seo.jsx` |
| H3 | **Orphaned practice sessions** — `DashboardPage.startSession` creates an `in_progress` `practice_session` but **never navigates to the practice page**, leaving orphaned records that also consume the freemium 5/day quota. | `apps/web/src/pages/DashboardPage.jsx` |
| H4 | **Build silently masks failures** — web build runs `node tools/generate-llms.js || true && vite build`; the `|| true` hides `generate-llms` failures (it exits 1 when no Helmet pages are found). | `apps/web/package.json`, `apps/web/tools/generate-llms.js` |
| H5 | **`start` doesn't serve the web app** — root `start` runs only api + pocketbase. | `package.json` |
| H6 | **`EcommerceApi.js` referenced but missing** — dev-only plugin references `../../src/api/EcommerceApi.js`, which doesn't exist (guarded by `existsSync`, so harmless at runtime). | `apps/web/plugins/site-pages/site-pages-server.js` |
| H7 | **`.env` incomplete → API crashes at boot** — missing `PB_SUPERUSER_*`, `INTEGRATED_AI_*`, `WEBSITE_*`, `PROXY_ENTRANCE_ID`; `process.exit(1)` on failed superuser auth. | `apps/api/.env`, `apps/api/src/utils/pocketbaseClient.js` |
| H8 | **Linux PocketBase binary in repo** — `apps/pocketbase/pocketbase` is Linux ELF; won't run on Windows (blocks local dev here). | `apps/pocketbase/pocketbase` |
| H9 | **Empty `<title>`** in `index.html` (mitigated by per-page react-helmet, but fragile). | `apps/web/index.html` |
| H10 | **`CORS_ORIGIN` empty** → browser API calls from any origin are denied by the API. | `apps/api/.env` |

### 9.3 Medium — quality, hygiene, robustness

| # | Issue | Where |
|---|---|---|
| M1 | **Duplicated auth helpers** — `getPocketbaseToken` / `authHeaders` copy-pasted in 4+ files. | PracticePages, DashboardPage, OnboardingPage, `lib/integratedAiClient.js` |
| M2 | **Hardcoded exam codes** `['waec','jamb','gce','neco','kcse']` repeated. | 3+ files + `CODES`/`SUPPORTED_EXAM_CODES` |
| M3 | **Raw query concatenation** — `GET /ads?placement=` string-concats the raw query value into the PB filter. | `apps/api/src/routes/ads.js` |
| M4 | **No `.gitignore`** (now added) — `pb_data/data.db` and `apps/api/.env` were committed. | repo root |
| M5 | **No README / docs / license** (now added). | repo root |
| M6 | **No test suite, no CI, no lint CI gate.** | repo |
| M7 | **Orphan/duplicate artifacts** — `app.tar.gz` (12.2 MB) sits in the repo root. | repo root |
| M8 | **`auto_renew`/`start_date`/`resolved_at`** fields added late in migrations; verify they're populated consistently. | migrations |
| M9 | **Essay freemium limit** — i18n has `essay.freemiumLimit` text but no enforcement found in `EssayPage.jsx` or the API. | web + api |
| M10 | **`site-pages` scan is Babel/AST-based** and coupled to dev-only plugins; flaky for production SEO. | `apps/web/plugins/` |

### 9.4 Snapshot drift — `app.tar.gz` vs working tree

`app.tar.gz` (12.2 MB, 261 entries) is **NOT identical** to the working tree:

- **In the tar, NOT in the tree:**
  - `apps/pocketbase/pb_hooks/superusers.pb.js`
  - `apps/pocketbase/pb_hooks/superusers-allow-list.js` (IP allow-list for superusers: 86.106.20.28, 89.116.209.21, 86.106.20.24, 84.32.173.80, 34.141.125.49, 35.230.138.117, 35.242.131.17, 34.89.86.34, 35.242.132.122, 35.234.116.158, 34.159.186.242)
- **In the tree, NOT in the tar:**
  - `apps/pocketbase/pb_hooks/custom-migrations-cmd.pb.js`
  - `apps/pocketbase/pb_hooks/external-dashboard.pb.js`

The tar also contains `apps/api/.env` (do not ship). **Before going further, reconcile which hooks should exist** — the superuser IP allow-list in particular looks like it was meant to be active. Decide: apply the allow-list hook, or intentionally drop it.

---

## 10. Prioritized roadmap

Proposed order. This is the "long ride" the banner at the top warns about.

**Phase 0 — Foundation**
- Reconcile `app.tar.gz` vs working tree (§9.4). Delete or archive the tar.
- Full `.env` provisioning (all `PB_SUPERUSER_*`, `INTEGRATED_AI_*`, `WEBSITE_*`, `PROXY_ENTRANCE_ID`, real `CORS_ORIGIN`, real Paystack key).
- Get a working local dev environment (WSL/container for PocketBase or a Windows PB binary) — §9.2/H8.
- Add test harness + CI later; for now document how to run.

**Phase 1 — Security (blockers)**
- [ ] C1: auth on all admin routes (ads, support). Server-side only.
- [ ] C2: real Paystack verification bound to the authenticated user; kill demo bypass in prod.
- [ ] C3: fix `admin_users` rules + UI check (or replace mechanism).
- [ ] C4: correct status codes in error middleware.
- [ ] Rotate anything that used the placeholder/committed key.

**Phase 2 — Reliability & correctness**
- [ ] H3: fix practice session flow (navigate on start; don't count orphans against quota).
- [ ] H4/H5: fix build/start scripts; remove `|| true`.
- [ ] H7/H10: API boots with sane defaults; CORS configured.
- [ ] M3: parameterize the `/ads` filter.
- [ ] M1/M2: extract shared auth helpers + exam-code constants.

**Phase 3 — Feature unlock**
- [ ] H1: mount the integrated AI chat UI (requires DeepSeek key).
- [ ] H2: use `Seo.jsx` or standardize react-helmet usage.
- [ ] M9: enforce essay freemium limit.
- [ ] Payment UX polish (demo vs live).

**Phase 4 — Product & infra**
- [ ] Decide monorepo conventions: TS adoption?, testing framework, lint gates.
- [ ] Deployment automation (CI/CD) + config as code (so hosting isn't only on Hostinger's side).
- [ ] Observability: structured logs, error tracking.
- [ ] Refresh schema: index questions by exam, caching for leaderboard, etc.

---

## Contributing

- No hard conventions yet — **expect them to be introduced during the refactor**.
- When in doubt, ask the team before building on top of known-broken code (§9).
- Run lint before pushing: `npm run lint`.
- Never commit secrets: keep `*.env` out of git (now gitignored).

---

*Review performed: 2026-08-11. Scope: apps/web, apps/api, apps/pocketbase, root tooling.*
