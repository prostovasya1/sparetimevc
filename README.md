# sparetimevc.com

Company website for Spare Time Ventures LLC. Plain HTML + CSS, no build step.
Hosted on Cloudflare Pages (project `sparetimevc`). `app-ads.txt` and the game folders come from the sparetime monorepo (`npx sparetime site`, output `site/publish/`); copy them here, never edit them by hand.

Edit `index.html` / `privacy.html` / `style.css`, push to `main`, then deploy.

Deploy: npx wrangler pages deploy . --project-name sparetimevc --branch main (not connected to Git)
