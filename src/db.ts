export type Link = {
  slug: string;
  redirect_url: string;
  eyebrow: string;
  brand: string;
  badge: string;
  button_label: string;
  click_count: number;
  created_at: string;
};

export type LinkOverrides = Partial<
  Pick<Link, "eyebrow" | "brand" | "badge" | "button_label">
>;

export async function listLinks(db: D1Database): Promise<Link[]> {
  const { results } = await db
    .prepare("SELECT * FROM links ORDER BY created_at DESC")
    .all<Link>();
  return results ?? [];
}

export async function getLink(
  db: D1Database,
  slug: string,
): Promise<Link | null> {
  const row = await db
    .prepare("SELECT * FROM links WHERE slug = ?")
    .bind(slug)
    .first<Link>();
  return row ?? null;
}

export async function createLink(
  db: D1Database,
  input: { slug: string; redirect_url: string } & LinkOverrides,
): Promise<void> {
  const fields = ["slug", "redirect_url"];
  const values: (string | number)[] = [input.slug, input.redirect_url];
  for (const key of ["eyebrow", "brand", "badge", "button_label"] as const) {
    if (input[key] !== undefined && input[key] !== null && input[key] !== "") {
      fields.push(key);
      values.push(input[key] as string);
    }
  }
  const placeholders = fields.map(() => "?").join(", ");
  await db
    .prepare(
      `INSERT INTO links (${fields.join(", ")}) VALUES (${placeholders})`,
    )
    .bind(...values)
    .run();
}

export async function updateLink(
  db: D1Database,
  slug: string,
  patch: { redirect_url?: string } & LinkOverrides,
): Promise<void> {
  const sets: string[] = [];
  const values: (string | number)[] = [];
  const allowed = [
    "redirect_url",
    "eyebrow",
    "brand",
    "badge",
    "button_label",
  ] as const;
  for (const key of allowed) {
    const v = (patch as Record<string, unknown>)[key];
    if (typeof v === "string" && v.length > 0) {
      sets.push(`${key} = ?`);
      values.push(v);
    }
  }
  if (sets.length === 0) return;
  values.push(slug);
  await db
    .prepare(`UPDATE links SET ${sets.join(", ")} WHERE slug = ?`)
    .bind(...values)
    .run();
}

export async function deleteLink(
  db: D1Database,
  slug: string,
): Promise<void> {
  await db.prepare("DELETE FROM links WHERE slug = ?").bind(slug).run();
}

export async function incrementClick(
  db: D1Database,
  slug: string,
): Promise<void> {
  await db
    .prepare("UPDATE links SET click_count = click_count + 1 WHERE slug = ?")
    .bind(slug)
    .run();
}
