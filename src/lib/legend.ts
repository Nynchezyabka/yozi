/** "Rare overcoming": secret legendary form. Progress never resets — the best streak is kept forever. */
import { dayKey, isCozyDay, type Entry } from "./care";
import type { Act } from "./pet";

export const LEGEND_STREAK = 7;
const D = 86400_000;
const FOOD = new Set(["snack", "lunch", "warm", "soft"]);

/** Harmony day: cozy eating (3+ meals, no gap > 4h) + slept well + went outside. */
export function isHarmonyDay(day: Act[]): boolean {
  const meals = day.filter((a) => FOOD.has(a.kind)) as Entry[];
  return isCozyDay(meals) && day.some((a) => a.kind === "sleep") && day.some((a) => a.kind === "walk");
}

export function harmony(acts: Act[], now = Date.now()) {
  const by = new Map<string, Act[]>();
  for (const a of acts) { const k = dayKey(a.at); by.set(k, [...(by.get(k) ?? []), a]); }
  const ok = (k: string) => isHarmonyDay(by.get(k) ?? []);
  const total = [...by.keys()].filter(ok).length;
  // best streak ever: walk days chronologically
  const keys = [...by.keys()].filter(ok).sort();
  let best = 0, run = 0, prev = "";
  for (const k of keys) {
    const p = dayKey(new Date(k + "T12:00").getTime() - D);
    run = prev === p ? run + 1 : 1; prev = k; best = Math.max(best, run);
  }
  // current: ending today, or yesterday if today isn't done yet (no penalty for an unfinished day)
  let cur = 0, t = ok(dayKey(now)) ? now : now - D;
  while (ok(dayKey(t))) { cur++; t -= D; }
  return { total, best, current: cur, legend: best >= LEGEND_STREAK };
}

export type Achievement = { id: string; icon: string; name: string; desc: string; got: boolean };
export function achievements(acts: Act[], h: ReturnType<typeof harmony>, gameBest: number): Achievement[] {
  const n = (k: string) => acts.filter((a) => a.kind === k).length;
  const food = acts.filter((a) => FOOD.has(a.kind)).length;
  return [
    { id: "first", icon: "🥚", name: "Первая искра", desc: "отметить первую заботу", got: acts.length > 0 },
    { id: "lunch", icon: "🍲", name: "Мастер Спелл-карты Горячего Обеда", desc: "10 сытных обедов", got: n("lunch") >= 10 },
    { id: "night", icon: "🌙", name: "Победительница Полуночного Дофамина", desc: "5 раз выспаться 7+ часов", got: n("sleep") >= 5 },
    { id: "walk", icon: "🍄", name: "Грибная странница", desc: "10 прогулок", got: n("walk") >= 10 },
    { id: "feast", icon: "🍙", name: "Онигири Вечности", desc: "50 приёмов пищи", got: food >= 50 },
    { id: "harm1", icon: "☯️", name: "Первая Гармония", desc: "день: 3+ еды без долгих пауз, сон и прогулка", got: h.total >= 1 },
    { id: "harm3", icon: "🔮", name: "Тройной Резонанс", desc: "3 дня Гармонии подряд", got: h.best >= 3 },
    { id: "stars", icon: "🌠", name: "Ловчая Звёзд", desc: "поймать 20 звёзд в мини-игре", got: gameBest >= 20 },
    { id: "legend", icon: "👑", name: "Владычица Астрала", desc: "7 дней Гармонии подряд — секретная форма", got: h.legend },
  ];
}
