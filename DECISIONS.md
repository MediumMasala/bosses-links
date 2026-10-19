# Design decisions

The *why* behind each non-obvious choice in this repo. Useful when adding features so you don't unintentionally walk back a deliberate call.

## 1. Hono + server-rendered HTML, not TanStack Start

Originally considered TanStack Start (the stack used by sibling repo [slide-into-action](https://github.com/MediumMasala/slide-into-action)) for stack consistency. Pivoted to plain Hono + Tailwind-via-CDN once it was clear the dashboard didn't need SSR or React — a CRUD form + table + drawer is well within reach of server-rendered HTML and inline `<script>`. Ships in ~5 files, ~600 LOC. No Lovable-preset wrangler quirks; deploy is `wrangler deploy` with no build step.

**When to revisit:** if the dashboard grows interactive state that's painful in vanilla JS (drag-reorder, multi-select bulk edit, optimistic updates with conflict handling). Until then, the simpler stack wins on maintenance cost.

## 2. No auth — admin path is the only gate

The admin dashboard lives under a single secret path stored in `wrangler.toml` `[vars] ADMIN_PATH` (default `manage-x7q9k2a`). There is no HTTP basic auth, no magic-link login, no session cookie. Anyone with the URL can CRUD.

**Trade-off explicitly accepted:** simplicity over security. This is a single-user internal tool, not a multi-tenant product. If the URL ever leaks (screen share, browser history sync, paste in a chat), rotate the var + redeploy — there are no per-user logins to migrate.

**When to revisit:** the moment more than one person uses the dashboard, or the moment a leak happens.

## 3. Custom domain attached via `wrangler.toml`, not the CF dashboard

The apex (`bossesofbangalore.com`) and `www` are both attached as Workers Custom Domains via `[[routes]]` entries with `custom_domain = true`. This lives in source control rather than as dashboard state, so the deploy is fully reproducible.

`workers_dev = true` is **kept enabled** so the original `bosses-links.yash-a8e.workers.dev` URL still serves the worker — wrangler auto-disables workers.dev when explicit routes are added, but any link shared on that URL before the custom domain went live would break. The cost of leaving workers.dev on is zero.

## 4. Dropped `/g/` prefix, kept `/g/:slug` as a legacy alias

Public links live at `<domain>/<slug>` (cleaner on a custom domain) rather than `<domain>/g/<slug>`. The legacy `/g/:slug` route is still wired so any links shared before the change keep working.

**Routing consequence:** since `/:slug` and `/:adminPath` are both single-segment GET routes, they'd collide in Hono. The code uses a single `GET /:first` handler that dispatches to the dashboard if `first === ADMIN_PATH`, else treats it as a slug lookup. This means **user-supplied slugs cannot collide with `ADMIN_PATH`** — there's no validation guard yet because `ADMIN_PATH` is an unguessable string, but if you ever shorten the admin path, add a check.

## 5. Campaign name optional, blank renders as em-dash

The one-tap quick-add flow (paste URL → hit `+` → short link auto-copied) was the load-bearing UX, so `campaign_name` is not required. Empty rows render as a faint `—` and the user can label later via the Edit drawer.

**The DB column is `NOT NULL DEFAULT ''`** so existing rows backfilled cleanly on migration. The `updateLink` function specifically allows writes of empty strings for `campaign_name` (other fields require non-empty), so the Edit drawer can clear the label.

## 6. D1, not stateless URL-encoded config

The alternative considered was encoding all branding in query params (`/?b=...&u=...`) and signing them with an HMAC. That would have meant zero infrastructure — no DB, no admin dashboard, no click counts. Rejected because:

- Open-redirect abuse without HMAC signing
- No edit-after-create
- No click analytics
- Worse UX than typing a URL into a form

D1 was the obvious fit; the single `links` table costs effectively nothing on Workers free plan.

## 7. Click tracking is a counter, not a time-series

`click_count` is a single integer per row, incremented via `ctx.waitUntil(db.incrementClick(slug))` so the redirect is never blocked by the write. There's no `click_events` table, no per-day breakdown, no UTM extraction.

**When to revisit:** the moment you want a time-series chart or to know *who* clicked. The migration is straightforward — add a `click_events` table with `(slug, ts, user_agent, ip_country)`.

## 8. Mobile-vs-desktop branch happens client-side, not server-side

The `Android|iPhone|iPad|iPod` UA check runs in inline JS, after the HTML has been served. Both surfaces receive the same HTML; mobile JS immediately sets `window.location.href`, desktop JS animates the interstitial.

This is verbatim from [slide-into-action](https://github.com/MediumMasala/slide-into-action) — kept the same shape so the interstitial component could be ported byte-for-byte. The mobile redirect costs one extra round-trip vs server-side `302`, but in practice the network savings are imperceptible and the simpler code path is worth more.

**Edge case to know about:** in-app browsers (Instagram, LinkedIn) with quirky UAs may match `iPhone` and get the mobile path even though they can't open WhatsApp natively from a redirect. If this becomes a real complaint, add UA-sniffing for the major in-app browsers and route them through the desktop interstitial (or a third "open in your default browser" state).

## 9. Per-link page template, picked from a dropdown

Each link has a `template` column (`bob` | `talboss`, list lives in `src/templates.ts`). The dashboard shows a Page dropdown on every row and in the quick-add bar; changing it PATCHes immediately. `bob` is the original orange Bosses of Bangalore page and the column default, so every link created before templates existed kept its page with no backfill (`migrations/0002_template.sql`).

The TalBoss page (black and white, tal BOSS app icon, "the fastest hiring app", 3-2-1 countdown then auto-press) uses fixed copy. The eyebrow/brand/badge/button fields only drive the `bob` page, because the existing rows all carry "bosses of bangalore" copy that would be wrong on a TalBoss page. Mobile still skips straight to the target on both templates.

**Adding a template:** add an entry to `TEMPLATES`, a `render…` function in `src/interstitial.ts`, and a branch in `renderInterstitial`. No migration needed.
