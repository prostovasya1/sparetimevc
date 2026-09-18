# Deploy sparetimevc.com from the Mac mini — session prompt

Paste everything below the line into a Claude Code session on the Mac mini.

---

Deploy the Spare Time LLC company website at **https://sparetimevc.com**. Do the work yourself; ask me only where a step needs a credential or a decision that isn't covered here.

## What already exists

- Repo: `https://github.com/prostovasya1/sparetimevc` (public). Static site — `index.html`, `privacy.html`, `style.css`, `favicon.svg`, `robots.txt`, `sitemap.xml`, `CNAME` (= `sparetimevc.com`), `.nojekyll`. No build step.
- GitHub Pages is **already enabled** on that repo (branch `main`, path `/`), custom domain `sparetimevc.com` set, latest build status `built`. The only thing missing is DNS.
- Domain: registered at GoDaddy on 2026-09-18, nameservers already moved to **Cloudflare** (`malavika.ns.cloudflare.com` / `rohin.ns.cloudflare.com`). The zone currently has A records that point at nothing useful — `https://sparetimevc.com` returns a Cloudflare **525**. Those records must be replaced.
- The Mac mini's `~/.cloudflared/cert.pem` is zone-scoped to **vdsafe.space** (see `server/launchd/README.md` in the voyant repo). `cloudflared tunnel route dns … sparetimevc.com` will therefore FAIL until a fresh `cloudflared tunnel login` scoped to `sparetimevc.com` is done — and a new login overwrites `cert.pem`. Only do that if you take Path C, and back up `cert.pem` first.

## Step 0 — clone and discover credentials

```bash
cd ~/Documents 2>/dev/null || cd ~
git clone https://github.com/prostovasya1/sparetimevc.git && cd sparetimevc
which wrangler cloudflared gh; env | grep -iE 'cloudflare|CF_API'
ls ~/.wrangler ~/Library/Preferences/.wrangler ~/.cloudflared 2>/dev/null
```

Report what you found, then pick the first path whose prerequisites are met.

## Path A (preferred) — keep GitHub Pages, add the DNS records

Needs a Cloudflare API token with **Zone → DNS → Edit** on `sparetimevc.com` (env `CLOUDFLARE_API_TOKEN`, or ask me to create one at dash.cloudflare.com → My Profile → API Tokens; I'll revoke it afterwards).

1. Look up the zone id: `GET https://api.cloudflare.com/client/v4/zones?name=sparetimevc.com`.
2. Delete every existing `A` / `AAAA` / `CNAME` record on the apex `sparetimevc.com` and on `www`.
3. Create, all with `"proxied": false` (grey cloud — GitHub must see its own IPs to issue the certificate):
   - `A  sparetimevc.com → 185.199.108.153`
   - `A  sparetimevc.com → 185.199.109.153`
   - `A  sparetimevc.com → 185.199.110.153`
   - `A  sparetimevc.com → 185.199.111.153`
   - `CNAME  www → prostovasya1.github.io`
4. Verify: `dig +short A sparetimevc.com` shows the four GitHub IPs; `gh api repos/prostovasya1/sparetimevc/pages --jq '.https_enforced,.protected_domain_state'`.
5. Wait for GitHub to provision the certificate (usually 5–30 min; poll `curl -sI https://sparetimevc.com | head -1` until `HTTP/2 200`), then enforce HTTPS:
   `gh api -X PUT repos/prostovasya1/sparetimevc/pages -F https_enforced=true`.
6. Confirm `https://www.sparetimevc.com` redirects to the apex and `https://sparetimevc.com/privacy.html` loads.

If `gh` on the mini isn't logged in as `prostovasya1`, `gh auth login` first (or skip step 5 and tell me; I can flip it from GitHub's Settings → Pages).

## Path B — host on Cloudflare Pages instead (same as voyanter.com)

Take this only if I say I'd rather have the site on Cloudflare Pages like `voyanter.com`. Needs a token with **Account → Cloudflare Pages → Edit** plus **Zone → DNS → Edit**.

1. `npx wrangler pages project create sparetimevc --production-branch main`
2. `npx wrangler pages deploy . --project-name sparetimevc` (the whole repo is the site; `DEPLOY.md`/`README.md` being published is harmless).
3. Add the custom domain: `POST /accounts/{account_id}/pages/projects/sparetimevc/domains` with `{"name":"sparetimevc.com"}`, and the same for `www.sparetimevc.com`.
4. DNS: delete the existing apex records, then `CNAME sparetimevc.com → sparetimevc.pages.dev` (proxied) and `CNAME www → sparetimevc.pages.dev` (proxied).
5. Optional: connect the GitHub repo in the Pages dashboard so every push redeploys; otherwise redeploy with the `wrangler pages deploy` command.
6. Remove the GitHub Pages custom domain so the two don't fight: `gh api -X PUT repos/prostovasya1/sparetimevc/pages -f cname=""` and delete the `CNAME` file from the repo.

## Path C (last resort) — serve from the Mac mini through the existing tunnel

Only if there is no way to get Cloudflare API access. This ties the company site to the mini's uptime, which is a poor fit for a page Apple and others will check — say so before doing it.

1. `cp ~/.cloudflared/cert.pem ~/.cloudflared/cert.pem.vdsafe.bak`, then `cloudflared tunnel login` and choose **sparetimevc.com** (this replaces `cert.pem`; the tunnel's `<tunnel-id>.json` credentials keep working, and the vdsafe.space hostnames already routed are unaffected).
2. Serve the clone on a free port, e.g. a launchd agent running `python3 -m http.server 8010 --directory ~/Documents/sparetimevc` (model it on `server/launchd/com.voyant.panel.plist`, RunAtLoad + KeepAlive).
3. Add to `~/.cloudflared/config.yml` ingress, above the 404 catch-all:
   `- hostname: sparetimevc.com` → `service: http://localhost:8010` and the same for `www.sparetimevc.com`.
4. `cloudflared tunnel ingress validate && pkill -HUP cloudflared`.
5. `cloudflared tunnel route dns macmini-tunnel sparetimevc.com` and `… www.sparetimevc.com` (delete the stale apex A records first, in the dashboard or via API, or `route dns` will refuse).
6. Restore the vdsafe cert afterwards only if something on vdsafe.space needs `route dns` again — the running tunnel does not need `cert.pem`.

## Done when

- `curl -sI https://sparetimevc.com | head -1` → `HTTP/2 200`, page title "Spare Time — an independent software studio".
- `https://www.sparetimevc.com` resolves (redirect or same page).
- `https://sparetimevc.com/privacy.html` → 200.
- Tell me which path you took, the exact DNS records now in the zone, and anything I should revoke (API token) or re-login (cloudflared cert).
