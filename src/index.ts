import { Hono, type Context } from "hono";
import * as db from "./db";
import { renderInterstitial } from "./interstitial";
import { renderDashboard } from "./dashboard";

type Bindings = {
  DB: D1Database;
  ADMIN_PATH: string;
  DEFAULT_EYEBROW: string;
  DEFAULT_BRAND: string;
  DEFAULT_BADGE: string;
  DEFAULT_BUTTON_LABEL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const SLUG_ALPHABET =
  "abcdefghijkmnopqrstuvwxyz23456789"; // no 0,1,l,o,i to avoid confusion

function genSlug(len = 7): string {
  let out = "";
  const buf = new Uint8Array(len);
  crypto.getRandomValues(buf);
  for (let i = 0; i < len; i++) {
    out += SLUG_ALPHABET[buf[i] % SLUG_ALPHABET.length];
  }
  return out;
}

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function adminOk(c: Context<{ Bindings: Bindings }>): boolean {
  return c.req.param("adminPath") === c.env.ADMIN_PATH;
}

// --- Public ---

app.get("/", (c) =>
  c.html(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>bosses-links</title><style>body{font-family:-apple-system,sans-serif;background:#fafafa;color:#666;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}</style></head><body><p>nothing here.</p></body></html>`,
  ),
);

async function serveSlug(c: Context<{ Bindings: Bindings }>, slug: string) {
  const link = await db.getLink(c.env.DB, slug);
  if (!link) return c.notFound();
  c.executionCtx.waitUntil(db.incrementClick(c.env.DB, slug));
  return c.html(renderInterstitial(link));
}

// Legacy /g/:slug — kept for any links already shared on workers.dev
app.get("/g/:slug", async (c) => serveSlug(c, c.req.param("slug")));

// --- Admin + slug dispatch (gated by ADMIN_PATH var) ---

// Single-segment GET: dashboard if first segment matches ADMIN_PATH, else slug lookup
app.get("/:first", async (c) => {
  const first = c.req.param("first");
  if (first === c.env.ADMIN_PATH) {
    const links = await db.listLinks(c.env.DB);
    return c.html(renderDashboard(links, { ADMIN_PATH: c.env.ADMIN_PATH }));
  }
  return serveSlug(c, first);
});

app.post("/:adminPath/links", async (c) => {
  if (!adminOk(c)) return c.notFound();
  const body = (await c.req.json().catch(() => null)) as
    | { redirect_url?: string; campaign_name?: string; eyebrow?: string; brand?: string; badge?: string; button_label?: string; slug?: string }
    | null;
  if (!body || typeof body.redirect_url !== "string" || !isValidUrl(body.redirect_url)) {
    return c.json({ error: "redirect_url must be a valid http(s) URL" }, 400);
  }

  // Slug: either user-supplied or random with collision retry
  let slug = (body.slug ?? "").trim().toLowerCase();
  if (slug) {
    if (!/^[a-z0-9-]{2,40}$/.test(slug)) {
      return c.json({ error: "slug must be 2-40 chars, a-z 0-9 -" }, 400);
    }
    const existing = await db.getLink(c.env.DB, slug);
    if (existing) return c.json({ error: "slug already taken" }, 409);
  } else {
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = genSlug();
      if (!(await db.getLink(c.env.DB, candidate))) {
        slug = candidate;
        break;
      }
    }
    if (!slug) return c.json({ error: "could not allocate slug" }, 500);
  }

  await db.createLink(c.env.DB, {
    slug,
    redirect_url: body.redirect_url,
    campaign_name: body.campaign_name,
    eyebrow: body.eyebrow,
    brand: body.brand,
    badge: body.badge,
    button_label: body.button_label,
  });
  const created = await db.getLink(c.env.DB, slug);
  return c.json(created);
});

app.patch("/:adminPath/links/:slug", async (c) => {
  if (!adminOk(c)) return c.notFound();
  const slug = c.req.param("slug");
  const existing = await db.getLink(c.env.DB, slug);
  if (!existing) return c.json({ error: "not found" }, 404);

  const body = (await c.req.json().catch(() => null)) as
    | { redirect_url?: string; campaign_name?: string; eyebrow?: string; brand?: string; badge?: string; button_label?: string }
    | null;
  if (!body) return c.json({ error: "invalid body" }, 400);
  if (body.redirect_url !== undefined && !isValidUrl(body.redirect_url)) {
    return c.json({ error: "redirect_url must be a valid http(s) URL" }, 400);
  }

  await db.updateLink(c.env.DB, slug, body);
  const updated = await db.getLink(c.env.DB, slug);
  return c.json(updated);
});

app.delete("/:adminPath/links/:slug", async (c) => {
  if (!adminOk(c)) return c.notFound();
  const slug = c.req.param("slug");
  await db.deleteLink(c.env.DB, slug);
  return c.json({ ok: true });
});

app.notFound((c) =>
  c.html(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>404</title><style>body{font-family:-apple-system,sans-serif;background:#fafafa;color:#666;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}</style></head><body><p>404</p></body></html>`,
    404,
  ),
);

export default app;
