import { describe, expect, it } from "vitest";
import { isCozyDay, cozyDays } from "./care";
const d = (h: number) => new Date(2026, 10, 10, h).getTime();
describe("cozy days", () => {
  it("counts a day with 3 meals and gaps of at most 4 hours", () => {
    expect(isCozyDay([{ kind: "snack", at: d(9) }, { kind: "lunch", at: d(13) }, { kind: "warm", at: d(17) }])).toBe(true);
  });
  it("does not count a day with a pause longer than 4 hours", () => {
    expect(isCozyDay([{ kind: "snack", at: d(8) }, { kind: "lunch", at: d(13) }, { kind: "warm", at: d(16) }])).toBe(false);
  });
  it("water does not count as a meal", () => {
    expect(isCozyDay([{ kind: "snack", at: d(9) }, { kind: "water", at: d(10) }, { kind: "water", at: d(11) }])).toBe(false);
  });
  it("sums cozy days", () => {
    const e = [9, 12, 15].flatMap((h) => [{ kind: "snack" as const, at: d(h) }, { kind: "snack" as const, at: d(h) + 86400000 }]);
    expect(cozyDays(e, d(10) + 5 * 86400000)).toBe(2);
  });
});
