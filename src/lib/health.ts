// Health profile, measurements and the doctor sheet. Pure functions — the UI only renders them.
import { dayKey } from "./care";

export type Mode = "teen" | "pregnancy" | "sport" | "custom";
export type Profile = { mode: Mode; name: string; gapHours: number; ketones: boolean; glucose: boolean; notes: string };
export type Measure = { at: number; kind: "ketone" | "glucose"; value: string };

export const MODES: Record<Mode, { label: string; icon: string; preset: Omit<Profile, "mode" | "name" | "notes"> }> = {
  teen: { label: "Подростковый баланс", icon: "🎧", preset: { gapHours: 4, ketones: false, glucose: false } },
  pregnancy: { label: "Беременность и датчик", icon: "🤰", preset: { gapHours: 3.5, ketones: true, glucose: true } },
  sport: { label: "Спорт и энергия", icon: "🧘", preset: { gapHours: 3.5, ketones: false, glucose: false } },
  custom: { label: "Свои особенности", icon: "✍️", preset: { gapHours: 4, ketones: false, glucose: false } },
};
export const KETONE_LEVELS = ["отр.", "следы", "+", "++", "+++"];
export const defaultProfile = (): Profile => ({ mode: "teen", name: "", notes: "", ...MODES.teen.preset });
export const applyMode = (p: Profile, mode: Mode): Profile => ({ ...p, mode, ...MODES[mode].preset });

const H = 3600_000;
export type Gap = { from: number; to: number; hours: number };
/** Pauses between consecutive meals (including the night pause). */
export function mealGaps(times: number[]): Gap[] {
  const t = [...times].sort((a, b) => a - b);
  return t.slice(1).map((to, i) => ({ from: t[i]!, to, hours: Math.round(((to - t[i]!) / H) * 10) / 10 }));
}
/** Daytime pauses longer than the profile's limit; the night pause (ending before 11:00 after 18:00) is listed separately. */
export const isNight = (g: Gap) => new Date(g.from).getHours() >= 18 && new Date(g.to).getHours() < 11 && g.hours < 16;
export const longGaps = (times: number[], limit: number) => mealGaps(times).filter((g) => !isNight(g) && g.hours > limit);

export type SheetRow = { day: string; meals: number[]; maxGap: number; night: number | null; ketones: string[]; glucose: string[] };
/** One row per calendar day for the endocrinologist, newest first. */
export function doctorSheet(meals: number[], measures: Measure[], days: number, now: number): SheetRow[] {
  const gaps = mealGaps(meals);
  const rows: SheetRow[] = [];
  for (let i = 0; i < days; i++) {
    const day = dayKey(now - i * 86400_000);
    const m = meals.filter((t) => dayKey(t) === day).sort((a, b) => a - b);
    const dayGaps = gaps.filter((g) => dayKey(g.to) === day);
    const ng = dayGaps.find(isNight);
    rows.push({
      day, meals: m,
      maxGap: Math.max(0, ...dayGaps.filter((g) => !isNight(g)).map((g) => g.hours)),
      night: ng ? ng.hours : null,
      ketones: measures.filter((x) => x.kind === "ketone" && dayKey(x.at) === day).map((x) => x.value),
      glucose: measures.filter((x) => x.kind === "glucose" && dayKey(x.at) === day).map((x) => x.value),
    });
  }
  return rows;
}

/** Short factual context for the AI helper — no names of other people, only today's picture. */
export function contextFor(p: Profile, meals: number[], measures: Measure[], now: number): string {
  const last = meals.length ? Math.max(...meals) : null;
  const since = last ? `${Math.round(((now - last) / H) * 10) / 10} ч` : "нет отметок";
  const today = meals.filter((t) => dayKey(t) === dayKey(now)).length;
  const lk = measures.filter((m) => m.kind === "ketone").at(-1);
  const lg = measures.filter((m) => m.kind === "glucose").at(-1);
  return [
    `Режим: ${MODES[p.mode].label}. Желаемый интервал между едой: до ${p.gapHours} ч.`,
    p.notes && `Особенности питания: ${p.notes}`,
    `С последней еды: ${since}. Приёмов пищи сегодня: ${today}.`,
    p.ketones && `Последние кетоны: ${lk ? lk.value : "не мерялись"}.`,
    p.glucose && `Последняя глюкоза: ${lg ? lg.value + " ммоль/л" : "нет данных"}.`,
  ].filter(Boolean).join("\n");
}
