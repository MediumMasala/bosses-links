# bosses-links

Tiny link generator: paste a WhatsApp invite, get a short link. The short link shows the **same branded interstitial** as [slide-into-action](https://github.com/MediumMasala/slide-into-action) on desktop, and redirects straight to WhatsApp on mobile.

**Live:**
- Dashboard: `https://bosses-links.yash-a8e.workers.dev/manage-x7q9k2a`
- Public link pattern: `https://bosses-links.yash-a8e.workers.dev/g/<slug>`

## What it does

| Surface | Behaviour |
| --- | --- |
| **Dashboard** | Single page with a quick-add bar + table. Paste a URL, hit `+`, the short link is auto-copied to your clipboard. Each row has Copy / Edit / Delete. Edit lets you override the per-link branding (eyebrow, brand, badge, button label). |
| **`/g/:slug` on mobile** | Redirects straight to `redirect_url` (Android / iPhone / iPad / iPod). |
| **`/g/:slug` on desktop** | Shows the same orange-gradient interstitial as slide-into-action — eyebrow, big lowercase brand, badge, auto-pressing CTA with 2s progress fill. |
| **Click count** | Incremented per visit via `ctx.waitUntil`. |

## Stack

- Cloudflare Workers + Hono
- D1 (database `bosses-links-db`)
- Server-rendered HTML; Tailwind via CDN for the dashboard; inline CSS for the interstitial

## Admin path

The dashboard lives under a secret path stored in `wrangler.toml` `[vars]`:

```toml
[vars]
ADMIN_PATH = "manage-x7q9k2a"
```

There is **no auth** beyond the unguessable path. Rotate it by changing the value and redeploying — there are no per-user logins to migrate.

## Develop

```bash
npm install
npx wrangler d1 execute bosses-links-db --local --file=./schema.sql
npx wrangler dev
```

## Deploy

```bash
CLOUDFLARE_ACCOUNT_ID=a8e831b9fc9f3941e67b0bd1885e1c45 npx wrangler deploy
```

## API (admin)

All routes are gated by `/:adminPath` and 404 otherwise.

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/:adminPath` | — | Dashboard HTML |
| POST | `/:adminPath/links` | `{ redirect_url, slug?, eyebrow?, brand?, badge?, button_label? }` | Created link row |
| PATCH | `/:adminPath/links/:slug` | Any subset of fields | Updated link row |
| DELETE | `/:adminPath/links/:slug` | — | `{ ok: true }` |

Slugs are auto-generated (7 chars, `a-z2-9`, no confusable 0/1/l/o/i) unless you pass one explicitly.
