/** Layer stack for the creature constructor. Lower z draws first.
 * Every mutation targets exactly one slot, so new art plugs in without redoing others. */
import type { Env } from "./pet";
import type { Phase } from "./sleep";

export const SLOTS = ["bg", "aura", "body", "eyes", "head", "hands", "night"] as const;
export type Slot = (typeof SLOTS)[number];
export type Layer = { slot: Slot; id: string; glyph: string };

export function buildLayers(o: { traits: (keyof Env)[]; phase: Phase; asleep: boolean; cocoon: boolean; eyes: number }): Layer[] {
  const L: Layer[] = [];
  if (o.traits.includes("water")) L.push({ slot: "aura", id: "bubbles", glyph: "🫧" });
  if (o.traits.includes("nourish")) L.push({ slot: "aura", id: "nebula", glyph: "🌌" });
  if (o.eyes >= 3) L.push({ slot: "eyes", id: "third-eye", glyph: "👁️" });
  if (o.traits.includes("air")) L.push({ slot: "head", id: "mushroom", glyph: "🍄" });
  if (o.traits.includes("rest")) L.push({ slot: "hands", id: "spoon", glyph: "🥄" });
  if (o.asleep || o.cocoon) L.push({ slot: "night", id: o.cocoon ? "cocoon" : "blanket", glyph: o.cocoon ? "🪺" : "💤" });
  else if (o.phase === "drowsy") L.push({ slot: "night", id: "nightcap", glyph: "🌙" });
  return L;
}
