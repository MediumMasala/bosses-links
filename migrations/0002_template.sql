-- Which interstitial design a link uses (see src/templates.ts).
-- Existing rows get 'bob' (the original orange Bosses of Bangalore page).
ALTER TABLE links ADD COLUMN template TEXT NOT NULL DEFAULT 'bob';
