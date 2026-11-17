import { describe, expect, it } from "vitest";
import { applyMode, doctorSheet, longGaps, mealGaps } from "./health";

const at = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m).getTime();

describe("health", () => {
  it("measures pauses between meals in hours", () => {
    expect(mealGaps([at(10, 13), at(10, 8, 30)]).map((g) => g.hours)).toEqual([4.5]);
  });
  it("pregnancy preset limits pauses to 3.5 h and turns on ketones and glucose", () => {
    const p = applyMode({ mode: "teen", name: "", notes: "", gapHours: 4, ketones: false, glucose: false }, "pregnancy");
    expect([p.gapHours, p.ketones, p.glucose]).toEqual([3.5, true, true]);
  });
  it("a daytime pause over the limit is flagged, the night pause is not", () => {
    const meals = [at(10, 8), at(10, 12), at(10, 20), at(11, 8)];
    expect(longGaps(meals, 3.5).map((g) => g.hours)).toEqual([4, 8]);
  });
  it("doctor sheet shows the night pause and ketones of the morning", () => {
    const meals = [at(10, 20), at(11, 7), at(11, 11)];
    const [row] = doctorSheet(meals, [{ at: at(11, 6, 50), kind: "ketone", value: "следы" }], 1, at(11, 12));
    expect(row!.night).toBe(11);
    expect(row!.maxGap).toBe(4);
    expect(row!.ketones).toEqual(["следы"]);
  });
});
