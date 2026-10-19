// Interstitial page designs a link can use. `bob` is the original orange page
// and the DB default, so links created before templates existed keep it.
export const TEMPLATES = [
  { id: "bob", label: "Bosses of Bangalore" },
  { id: "talboss", label: "TalBoss (dark)" },
] as const;

export type TemplateId = (typeof TEMPLATES)[number]["id"];

export const DEFAULT_TEMPLATE: TemplateId = "bob";

export function isTemplate(s: unknown): s is TemplateId {
  return TEMPLATES.some((t) => t.id === s);
}
