import { describe, expect, it } from "vitest";
import { stageOf, xpOf, environment, activeTraits, type Act } from "./pet";
const now = new Date(2026, 10, 10, 20).getTime();
const at = (dayAgo: number, h: number) => new Date(2026, 10, 10 - dayAgo, h).getTime();
describe("pet growth", () => {
  it("hatches from egg at 6 growth points and grows up at 40", () => {
    expect(stageOf(5)).toBe("egg");
    expect(stageOf(6)).toBe("baby");
    expect(stageOf(40)).toBe("adult");
  });
  it("food gives 2 points, water 1", () => {
    expect(xpOf([{ kind: "snack", at: 0 }, { kind: "water", at: 0 }])).toBe(3);
  });
  it("walks every day for 3 days unlock the mushroom crown", () => {
    const acts: Act[] = [0, 1, 2].map((d) => ({ kind: "walk", at: at(d, 15) }));
    expect(activeTraits(environment(acts, now))).toEqual(["air"]);
  });
  it("one walk in 3 days is not enough", () => {
    expect(activeTraits(environment([{ kind: "walk", at: at(0, 15) }], now))).toEqual([]);
  });
});
