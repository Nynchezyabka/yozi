import { describe, expect, it } from "vitest";
import { harmony, isHarmonyDay } from "./legend";
import type { Act } from "./pet";
const at = (day: number, h: number) => new Date(2026, 10, day, h).getTime();
const good = (day: number): Act[] => [
  { kind: "snack", at: at(day, 9) }, { kind: "lunch", at: at(day, 12) }, { kind: "warm", at: at(day, 15) },
  { kind: "sleep", at: at(day, 8) }, { kind: "walk", at: at(day, 16) },
];
describe("legendary harmony", () => {
  it("needs food rhythm, sleep and walk in one day", () => {
    expect(isHarmonyDay(good(1))).toBe(true);
    expect(isHarmonyDay(good(1).filter((a) => a.kind !== "walk"))).toBe(false);
  });
  it("a meal gap over 4 hours breaks harmony", () => {
    const d = good(1).map((a) => (a.kind === "warm" ? { ...a, at: at(1, 17) } : a));
    expect(isHarmonyDay(d)).toBe(false);
  });
  it("7 harmony days in a row unlock the legend; 6 do not", () => {
    const six = [1, 2, 3, 4, 5, 6].flatMap(good);
    expect(harmony(six, at(6, 20)).legend).toBe(false);
    expect(harmony([...six, ...good(7)], at(7, 20)).legend).toBe(true);
  });
  it("a broken chain keeps the best streak (never resets)", () => {
    const acts = [1, 2, 3, 5].flatMap(good);
    const h = harmony(acts, at(9, 20));
    expect(h.best).toBe(3);
    expect(h.current).toBe(0);
    expect(h.total).toBe(4);
  });
});
