// Plan display names come from the upgrade page copy, so every screen shows the same name.
type PlanCopy = { upgrade: { core: { name: string }; pro: { name: string }; elite: { name: string } } };

export function planName(t: PlanCopy, tier?: string | null): string {
  if (tier === "PRO") return t.upgrade.pro.name;
  if (tier === "ELITE") return t.upgrade.elite.name;
  return t.upgrade.core.name;
}
