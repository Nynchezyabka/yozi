/** Pure circadian rules for the creature. Hours are local. */
export type Phase = "day" | "drowsy" | "night";
export const DROWSY_FROM = 21.5, NIGHT_FROM = 22.5, MORNING_AT = 7;

export function phaseAt(t: number): Phase {
  const d = new Date(t);
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= NIGHT_FROM || h < MORNING_AT) return "night";
  if (h >= DROWSY_FROM) return "drowsy";
  return "day";
}

/** A completed night: lights out → wake. Good if 7+ hours. */
export function sleepQuality(start: number, end: number): "long" | "short" {
  return (end - start) / 3600_000 >= 7 ? "long" : "short";
}
