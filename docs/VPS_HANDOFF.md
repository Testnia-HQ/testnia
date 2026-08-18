# Testnia VPS Handoff — Business Lead Checklist

This document is for the business lead / Testnia owner who has access to Hostinger hPanel. The engineer will handle all code, Docker, and GitHub wiring after you provide the keys below.

---

## Why this is needed

The app was originally built on **Hostinger Horizons** (Hostinger's preview/hosting platform). Horizons does **not** support Git/GitHub integration — it cannot pull code from this repo or auto-deploy releases.

We now have a 1-month Ubuntu VPS with Docker installed. To get version control, CI/CD + releases from GitHub, we must run the full stack (web + API + PocketBase) on that VPS with Docker + GitHub Actions. That requires two Hostinger secrets: **VM ID** and an **API key**.

Do **not** share the API key in plain chat/email. Pass it to the engineer via a secure channel (1Password, Bitwarden, encrypted note).

---

## Step 0 — Find your VPS details

1. Log in to Hostinger hPanel: https://hpanel.hostinger.com
2. Left menu → **VPS** → click the VPS you just provisioned
3. You will see a row like:

   ```
   Hostname: srv1234567.hstgr.cloud
   IP Address: 123.45.67.89
   OS: Ubuntu 22.04 / 24.04
   ```
4. **VM ID** is the numeric part of the hostname **after `srv` and before `.hstgr.cloud`**.

   Example: `srv1234567.hstgr.cloud` → VM ID = `1234567`
5. Copy the **IP address** too — you'll need it for DNS.

---

## Step 1 — Create a Hostinger API key

1. In hPanel, go to **Profile** (top-right avatar) → **API**
2. Click **Generate API key**
3. Give it a recognizable label, e.g.: `Testnia-Deploy-Engineer`
4. Hostinger will show the key **once**. Copy it immediately.
5. Save it in a password manager and share it only with the engineer.

> Keep a record: **API key = `...`**
> **VM ID = `...`**
> **VPS IP = `...`**

---

## Step 2 — DNS for testnia.com

The domain will point to the VPS instead of Horizons.

1. In hPanel → **Domains** → select `testnia.com`
2. **DNS Zone** → add / edit the following records (all A records → **VPS IP address**, TTL 3600):
   - Host `@` → Points to → **VPS IP address**
   - Host `www` → Points to → **VPS IP address**
   - Host `pb` → Points to → **VPS IP address**
   - Host `api` → Points to → **VPS IP address**
3. Save and wait for propagation (usually a few minutes to an hour).

**Optional but recommended:** If you use Cloudflare in front of Hostinger DNS, enable proxy (orange cloud) for SSL/WAF. The engineer will then run `certbot` on the VPS, or we can let Cloudflare manage SSL.

---

## Step 3 — Pass credentials to the engineer

Send the engineer:

```
Hostinger VPS IP: <ip>
VM ID (srv<num>.hstgr.cloud): <num>
Hostinger API key: <full key>
Domain: testnia.com
Preferred engineer contact: <your channel>
```

That's it — no code changes needed from your side.

---

## Step 4 — Install the deploy key on the VPS (lead)

Hostinger's experimental **Docker Manager** only works on VPSes created from **Docker OS templates**. This VPS runs plain **Ubuntu 24.04**, so the GitHub Actions deploy (`hostinger/deploy-on-vps@v2`) reports success but never starts containers. Instead, the app is deployed by running a one-shot script directly on the VPS.

1. In hPanel → **VPS** → click the VPS → **Browser terminal** (or SSH in as root).
2. Generate a dedicated deploy key **inside the VPS** (Hostinger's documented flow for private repos):

   ```bash
   ssh-keygen -t ed25519 -C "testnia-deploy" -N "" -f ~/.ssh/testnia_deploy
   cat ~/.ssh/testnia_deploy.pub
   ```

3. Send the printed public key to the engineer. The engineer adds it as a **read-only Deploy Key** on the GitHub repo (`Testnia-HQ/testnia` → Settings → Deploy keys). Access is then restricted to this single repository.
4. Configure SSH to use the key for GitHub:

   ```bash
   mkdir -p ~/.ssh && chmod 700 ~/.ssh
   grep -q github.com ~/.ssh/config 2>/dev/null || printf 'Host github.com\n    HostName github.com\n    User git\n    IdentityFile ~/.ssh/testnia_deploy\n    IdentitiesOnly yes\n' >> ~/.ssh/config
   chmod 600 ~/.ssh/config
   ```

5. Verify: `ssh -T git@github.com` should print `Hi <deploy-key-name>! ... successfully authenticated`.

---

## Step 5 — Deploy (lead)

Once the deploy key is added on GitHub, run the one-shot deploy script from the VPS terminal:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/Testnia-HQ/testnia/main/deploy/setup-vps.sh)
```

The script:
- Installs Docker + compose plugin if missing
- Tests GitHub SSH access with the deploy key
- Clones the private repo to `/opt/testnia` (branch `main`)
- Generates `.env` with auto-created `PB_ENCRYPTION_KEY`, `PB_SUPERUSER_EMAIL`, `PB_SUPERUSER_PASSWORD` (or you can pre-set them as env vars before running)
- Runs `docker compose up -d --build` (web + api + pocketbase + caddy)
- Waits for health checks and prints the service status

When it finishes, it prints the credentials and the URLs. Sites served with free Caddy TLS:
- `https://testnia.com` (web)
- `https://pb.testnia.com` (PocketBase admin)
- `https://api.testnia.com` (API `/health`)

---

## What happens next (engineer side)

The engineer's setup is already committed to the repo:

1. ✅ Docker stack done: `docker/web`, `docker/api`, `docker/pocketbase`, `docker/caddy` Dockerfiles + root `docker-compose.yml` (Caddy gives free HTTPS for `testnia.com`, `pb.testnia.com`, `api.testnia.com`)
2. ✅ `/hcgi/platform` and `/hcgi/api` replaced with env-driven URLs (`VITE_PB_URL`, `VITE_API_URL`, `PB_HOST`, `PB_PUBLIC_URL`)
3. ✅ `deploy/setup-vps.sh` one-shot installer (clone → env → build → healthcheck)
4. ✅ `.github/workflows/deploy.yml` via `hostinger/deploy-on-vps@v2` — currently **not functional on a plain Ubuntu template** (Docker Manager is experimental and needs a Docker OS template). Kept for future use; the script in Step 5 is the active path.
5. After the 1-month trial you can decide to renew, resize, or migrate the VPS. If you later recreate the VPS from a **Docker OS template**, the GitHub Actions workflow should start working as-is.

---

## Security notes

- The API key can start/stop VMs and push files — treat it like a password.
- Revoke the key in hPanel → Profile → API when the project ends or if it leaks.
- If the VPS is ever compromised, change the API key immediately.

---

## Quick FAQ

**Q: Can we keep Horizons and just add a Git hook?**
A: No. Hostinger's official docs state Horizons has no Git integration and cannot be managed via API. We must move the stack to VPS.

**Q: Will the PocketBase data migrate?**
A: Yes. Current `apps/pocketbase/pb_data` will be exported/imported to the VPS volume. The engineer will handle the backup.

**Q: Do we need to pay for anything else?**
A: The 1-month VPS is covered. The engineer will use a free Let's Encrypt certificate for SSL. No additional Hostinger charges unless you upgrade the VPS.

---

**Ready to proceed when the VM ID, API key, and VPS IP are provided.**
