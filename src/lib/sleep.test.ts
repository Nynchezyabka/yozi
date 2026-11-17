import { describe, it, expect } from "vitest";
import { phaseAt, sleepQuality } from "./sleep";
import { buildLayers } from "./layers";
const at = (h: number, m = 0) => new Date(2026, 0, 5, h, m).getTime();
describe("sleep", () => {
  it("23:00 is night", () => expect(phaseAt(at(23))).toBe("night"));
  it("03:00 is night", () => expect(phaseAt(at(3))).toBe("night"));
  it("21:45 is drowsy", () => expect(phaseAt(at(21, 45))).toBe("drowsy"));
  it("15:00 is day", () => expect(phaseAt(at(15))).toBe("day"));
  it("7h sleep is long", () => expect(sleepQuality(0, 7 * 3600_000)).toBe("long"));
  it("5h sleep is short", () => expect(sleepQuality(0, 5 * 3600_000)).toBe("short"));
  it("asleep adds blanket layer", () => expect(buildLayers({ traits: [], phase: "night", asleep: true, cocoon: false, eyes: 1 }).map((l) => l.id)).toContain("blanket"));
});
