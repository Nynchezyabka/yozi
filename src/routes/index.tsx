import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import cat from "@/assets/cat-barista.png";
import { MEALS, IDEAS, REWARDS, careMood, cozyDays, lastFood, dayKey, type Entry, type MealKind } from "@/lib/care";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Уютная кофейня энергии — компаньон питания" },
      { name: "description", content: "Пиксельный кот-бариста мягко напоминает подкрепиться, попить воды и дарит книги и пластинки за уютные дни." },
      { property: "og:title", content: "Уютная кофейня энергии" },
      { property: "og:description", content: "Бережный lo-fi компаньон: без калорий, без давления, только забота." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const KEY = "cozy-cafe-entries";
const CHEERS = ["Мурр, спасибо, что позаботилась о себе 💛", "Энергия восстановлена! ✨", "Ты молодец. Вкусного!", "Кот-бариста одобрительно мурлычет ☕"];

function fmt(h: number) {
  const m = Math.floor(h * 60);
  return m < 60 ? `${m} мин` : `${Math.floor(m / 60)} ч ${m % 60} мин`;
}

function Index() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [now, setNow] = useState(Date.now());
  const [cheer, setCheer] = useState<string | null>(null);
  const [soft, setSoft] = useState(false);
  const [tab, setTab] = useState<"ideas" | "shelf">("ideas");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch {}
    setSoft(localStorage.getItem("cozy-soft") === "1");
    setReady(true);
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(entries)); }, [entries, ready]);
  useEffect(() => { if (ready) localStorage.setItem("cozy-soft", soft ? "1" : "0"); }, [soft, ready]);

  const last = lastFood(entries);
  const hours = last ? (now - last) / 3600_000 : null;
  const mood = careMood(hours);
  const today = entries.filter((e) => dayKey(e.at) === dayKey(now));
  const water = today.filter((e) => e.kind === "water").length;
  const days = cozyDays(entries, now);
  const unlocked = REWARDS.slice(0, Math.min(days, REWARDS.length));
  const ideas = useMemo(() => IDEAS.filter((i) => !soft || i.soft), [soft]);

  const log = (kind: MealKind) => {
    setEntries((e) => [...e, { kind, at: Date.now() }]);
    setNow(Date.now());
    setCheer(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
    setTimeout(() => setCheer(null), 2600);
  };
  const undo = () => setEntries((e) => e.slice(0, -1));
  const meals = soft ? [...MEALS].sort((a) => (a.kind === "soft" ? -1 : 0)) : MEALS;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl md:text-3xl text-wood">☕ Кофейня «Тёплая глава»</h1>
        <button onClick={() => setSoft(!soft)} className={`pixel-box px-3 py-2 text-sm font-semibold ${soft ? "bg-accent text-accent-foreground" : "bg-card"}`}>
          🦷 Мягкая еда: {soft ? "вкл" : "выкл"}
        </button>
      </header>

      <section className="grid md:grid-cols-[260px_1fr] gap-6 items-center pixel-box bg-card p-5">
        <img src={cat} alt="Пиксельный кот-бариста" width={816} height={816} className="w-48 md:w-60 mx-auto animate-bob" style={{ imageRendering: "pixelated" }} />
        <div className="space-y-4">
          <div className="relative pixel-box bg-background p-4 text-lg">
            {cheer ? <span className="animate-pop inline-block">{cheer}</span> : mood.text}
            {soft && !cheer && <p className="mt-2 text-sm text-muted-foreground">Зубки ноют? Сегодня — смузи, супы-пюре и суфле. Береги себя 💗</p>}
          </div>
          <div>
            <div className="flex justify-between text-sm font-semibold mb-1">
              <span className="font-pixel">HP / Мана</span>
              <span>{hours === null ? "ещё не заправлялась" : `подзарядка ${fmt(hours)} назад`}</span>
            </div>
            <div className="h-5 pixel-box bg-muted overflow-hidden p-0">
              <div className="h-full bg-primary transition-all duration-700" style={{ width: `${mood.level * 100}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span className="font-pixel mr-2">Вода:</span>
            {Array.from({ length: 8 }).map((_, i) => <span key={i} className={i < water ? "" : "opacity-25"}>💧</span>)}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl mb-3">Восстановить энергию</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {meals.map((m) => (
            <button key={m.kind} onClick={() => log(m.kind)}
              className={`pixel-box p-4 flex flex-col items-center gap-1 transition-transform hover:-translate-y-1 active:translate-y-0.5 ${m.kind === "water" ? "bg-mana/30" : m.kind === "soft" && soft ? "bg-accent" : "bg-card"}`}>
              <span className="text-4xl">{m.icon}</span>
              <span className="font-semibold text-sm text-center">{m.label}</span>
              <span className="font-pixel text-xs text-primary">{m.hp}</span>
            </button>
          ))}
        </div>
        {today.length > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            Сегодня: {today.map((e) => MEALS.find((m) => m.kind === e.kind)?.icon).join(" ")}{" "}
            <button onClick={undo} className="underline ml-2">отменить последнее</button>
          </p>
        )}
      </section>

      <section className="pixel-box bg-card p-5">
        <div className="flex gap-2 mb-4">
          {(["ideas", "shelf"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`font-pixel px-3 py-1 rounded ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {t === "ideas" ? "🫙 Копилка идей" : "📚 Моя полка"}
            </button>
          ))}
        </div>
        {tab === "ideas" ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {ideas.map((i) => (
              <div key={i.t} className="rounded-lg border-2 border-input bg-background p-3">
                <p className="font-bold">{i.t}</p>
                <p className="text-sm text-muted-foreground">{i.d}</p>
                {i.soft && <span className="text-xs text-accent-foreground bg-accent rounded px-2 mt-1 inline-block">мягко для брекетов</span>}
              </div>
            ))}
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Уютных дней (3+ подзарядки без пауз дольше 4 часов): <b className="text-foreground">{days}</b>. За каждый на полке появляется что-то новое.
            </p>
            <div className="bg-wood/20 rounded-lg p-4 border-b-8 border-wood grid grid-cols-5 gap-3 min-h-28">
              {REWARDS.map((r, i) => (
                <div key={i} title={i < unlocked.length ? r.name : "Ещё впереди"} className={`flex flex-col items-center text-center ${i < unlocked.length ? "animate-pop" : "opacity-20 grayscale"}`}>
                  <span className="text-4xl">{r.icon}</span>
                  <span className="text-[11px] leading-tight mt-1">{i < unlocked.length ? r.name : "?"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <footer className="text-center text-xs text-muted-foreground pb-4">Здесь нет калорий, весов и «плохой» еды. Только забота о тебе 🌙</footer>
    </main>
  );
}
