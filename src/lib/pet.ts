import { isCozyDay, dayKey, type Entry as MealEntry, type MealKind } from "./care";

export type ActKind = MealKind | "sleep" | "walk" | "rest";
export type Act = { kind: ActKind; at: number };

export const ACTIONS: { kind: ActKind; label: string; icon: string; group: "food" | "water" | "sleep" | "walk" }[] = [
  { kind: "snack", label: "Перекус", icon: "🍪", group: "food" },
  { kind: "lunch", label: "Сытная еда", icon: "🍲", group: "food" },
  { kind: "warm", label: "Что-то тёплое", icon: "☕", group: "food" },
  { kind: "soft", label: "Мягкая еда", icon: "🍮", group: "food" },
  { kind: "water", label: "Вода", icon: "💧", group: "water" },
  { kind: "sleep", label: "Легла вовремя", icon: "🌙", group: "sleep" },
  { kind: "rest", label: "15 мин без экрана", icon: "🫧", group: "sleep" },
  { kind: "walk", label: "Вышла на воздух", icon: "🍄", group: "walk" },
];

const D = 86400_000;
const FOOD = new Set<ActKind>(["snack", "lunch", "warm", "soft"]);

/** Growth points per action. Growth never goes down. */
export function xpOf(acts: Act[]): number {
  return acts.reduce((s, a) => s + (FOOD.has(a.kind) ? 2 : a.kind === "water" ? 1 : 2), 0);
}

export const STAGES = [
  { id: "egg", name: "Космическое яйцо", from: 0 },
  { id: "baby", name: "Желейный малыш", from: 6 },
  { id: "adult", name: "Астральный ёкай", from: 40 },
] as const;
export type StageId = (typeof STAGES)[number]["id"];

export function stageOf(xp: number): StageId {
  let s: StageId = "egg";
  for (const st of STAGES) if (xp >= st.from) s = st.id;
  return s;
}

/** Environment over the last 3 days, each 0..1. */
export function environment(acts: Act[], now = Date.now()) {
  const days = [0, 1, 2].map((i) => dayKey(now - i * D));
  const by = (k: string) => acts.filter((a) => dayKey(a.at) === k);
  const avg = (f: (list: Act[]) => number) => days.reduce((s, k) => s + Math.min(1, f(by(k))), 0) / 3;
  return {
    nourish: avg((l) => (isCozyDay(l.filter((a) => FOOD.has(a.kind)) as MealEntry[]) ? 1 : l.filter((a) => FOOD.has(a.kind)).length / 4)),
    water: avg((l) => l.filter((a) => a.kind === "water").length / 5),
    rest: avg((l) => l.filter((a) => a.kind === "sleep").length + l.filter((a) => a.kind === "rest").length * 0.5),
    air: avg((l) => l.filter((a) => a.kind === "walk").length),
  };
}
export type Env = ReturnType<typeof environment>;

export const TRAIT_AT = 0.6;
export const TRAITS: { key: keyof Env; name: string; icon: string; desc: string }[] = [
  { key: "nourish", name: "Сияющее ядро", icon: "🌟", desc: "регулярная еда — внутри разгорается туманность" },
  { key: "water", name: "Пузырьковый нимб", icon: "🫧", desc: "вода — вокруг парят пузыри" },
  { key: "rest", name: "Сонные споры", icon: "✨", desc: "сон и отдых — окрас глубже, искры" },
  { key: "air", name: "Грибная корона", icon: "🍄", desc: "прогулки — на голове растут находки" },
];
export const activeTraits = (env: Env) => TRAITS.filter((t) => env[t.key] >= TRAIT_AT).map((t) => t.key);

/** Genes rolled once at hatching: shape of the creature, never changes. */
export function genes(seed: number) {
  const hue = seed % 360;
  const eyes = 1 + (Math.floor(seed / 360) % 3);
  const temper = ["ворчливый философ", "сонный мечтатель", "хаотичный гремлин", "загадочный оракул"][Math.floor(seed / 7) % 4]!;
  return { hue, eyes, temper };
}

export function petLine(hoursSinceFood: number | null, stage: StageId) {
  if (stage === "egg") return "Яйцо тихо гудит. Кажется, ему нравится, когда ты о себе заботишься.";
  if (hoursSinceFood === null) return "Бззт. Я питаюсь твоей энергией. Буквально. Поешь — и я засияю ✨";
  if (hoursSinceFood < 2) return "Мурлычу на частоте 432 Гц. Всё в порядке во вселенной.";
  if (hoursSinceFood < 4) return "Моя туманность слегка тускнеет… не срочно, но перекус бы не помешал.";
  return "Я свернулся в мягкий кокон и жду. Хоть пара печенек — и я снова тут 🍪";
}
