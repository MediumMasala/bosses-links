CREATE TABLE IF NOT EXISTS links (
  slug TEXT PRIMARY KEY,
  redirect_url TEXT NOT NULL,
  campaign_name TEXT NOT NULL DEFAULT '',
  eyebrow TEXT NOT NULL DEFAULT 'You are about to join',
  brand TEXT NOT NULL DEFAULT 'bosses of bangalore',
  badge TEXT NOT NULL DEFAULT 'beta',
  button_label TEXT NOT NULL DEFAULT 'Join the group',
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC);
