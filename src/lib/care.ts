export type MealKind = "snack" | "lunch" | "warm" | "soft" | "water";
export type Entry = { kind: MealKind; at: number };

export const MEALS: { kind: MealKind; label: string; icon: string; hp: string }[] = [
  { kind: "snack", label: "Перекус", icon: "🍪", hp: "+15 HP" },
  { kind: "lunch", label: "Сытный обед", icon: "🍲", hp: "+40 HP" },
  { kind: "warm", label: "Что-то тёплое", icon: "☕", hp: "+20 маны" },
  { kind: "soft", label: "Мягкая еда", icon: "🍮", hp: "+25 HP" },
  { kind: "water", label: "Вода", icon: "💧", hp: "+10 маны" },
];

/** Longest comfortable pause between meals, in hours. */
export const GAP_HOURS = 4;
const H = 3600_000;

const food = (e: Entry[]) => e.filter((x) => x.kind !== "water");
export const dayKey = (t: number) => new Date(t).toLocaleDateString("sv-SE");

/** A cozy day: at least 3 food check-ins and no gap longer than GAP_HOURS between them. */
export function isCozyDay(entries: Entry[]): boolean {
  const f = food(entries).map((e) => e.at).sort((a, b) => a - b);
  if (f.length < 3) return false;
  for (let i = 1; i < f.length; i++) if (f[i]! - f[i - 1]! > GAP_HOURS * H) return false;
  return true;
}

export function cozyDays(entries: Entry[], today = Date.now()): number {
  const byDay = new Map<string, Entry[]>();
  for (const e of entries) {
    const k = dayKey(e.at);
    byDay.set(k, [...(byDay.get(k) ?? []), e]);
  }
  let n = 0;
  for (const [k, list] of byDay) if (k !== dayKey(today) && isCozyDay(list)) n++;
  // today counts as soon as it qualifies
  if (isCozyDay(byDay.get(dayKey(today)) ?? [])) n++;
  return n;
}

export function lastFood(entries: Entry[]): number | null {
  const f = food(entries);
  return f.length ? Math.max(...f.map((e) => e.at)) : null;
}

export function careMood(hoursSince: number | null) {
  if (hoursSince === null) return { level: 0, text: "Привет! Начнём день с чего-нибудь вкусного? Без маны даже данмаку не увернёшься 🌸" };
  if (hoursSince < 1.5) return { level: 1, text: "Энергия полна ✨ Можно спокойно читать дальше." };
  if (hoursSince < 3) return { level: 0.7, text: "Всё уютно. Не забудь про глоток воды между главами 💧" };
  if (hoursSince < GAP_HOURS) return { level: 0.4, text: "Пора подкрепиться перед новой каткой или главой 🎮📖" };
  return { level: 0.15, text: "Тревога в Генсокё: мана на исходе! Может, маленький перекус? Хоть пара печенек — уже хорошо 🍪" };
}

export const REWARDS = [
  { icon: "📕", name: "«Маленькие женщины»" },
  { icon: "💿", name: "Lo-fi винил «Rainy Seoul»" },
  { icon: "☕", name: "Чашка с маршмеллоу" },
  { icon: "📗", name: "Сборник манхвы" },
  { icon: "💿", name: "OST любимой дорамы" },
  { icon: "🍵", name: "Кружка матча-латте" },
  { icon: "📘", name: "Книга сказок о звёздах" },
  { icon: "💿", name: "Пластинка «Jazz Café»" },
  { icon: "🫖", name: "Чайник с котиком" },
  { icon: "📙", name: "Дневник уютных дней" },
];

export const IDEAS = [
  { t: "Банан + арахисовая паста", d: "2 минуты, держит энергию", soft: false },
  { t: "Йогурт с мёдом", d: "Нежно и сладко", soft: true },
  { t: "Смузи банан-клубника", d: "Пить через трубочку — брекеты рады", soft: true },
  { t: "Суп-пюре из тыквы", d: "Тёплый, как плед", soft: true },
  { t: "Творожное суфле", d: "Тает во рту", soft: true },
  { t: "Овсянка с ягодами", d: "Тёплый старт дня", soft: true },
  { t: "Тост с сыром", d: "Хрустящее счастье", soft: false },
  { t: "Печёное яблоко с корицей", d: "Пахнет как кофейня", soft: true },
  { t: "Рисовые хлебцы с авокадо", d: "Быстро и красиво", soft: false },
  { t: "Омлет-суфле", d: "Мягкий и пушистый", soft: true },
  { t: "Сырники", d: "Можно заготовить заранее", soft: true },
  { t: "Пудинг из чиа", d: "Сделала вечером — съела утром", soft: true },
  { t: "Кисель или компот", d: "Тёплое питьё для маны", soft: true },
  { t: "Горсть сухофруктов", d: "Влезает в любой рюкзак", soft: false },
];
