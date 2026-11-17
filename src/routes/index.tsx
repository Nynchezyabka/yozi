import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import egg from "@/assets/pet-egg.png";
import baby from "@/assets/pet-baby.png";
import adult from "@/assets/pet-adult.png";
import { IDEAS, dayKey } from "@/lib/care";
import { ACTIONS, STAGES, TRAITS, activeTraits, environment, genes, petLine, stageOf, xpOf, type Act, type ActKind } from "@/lib/pet";
import { StarCatch } from "@/components/StarCatch";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Астральный питомец — расти существо заботой о себе" },
      { name: "description", content: "Странное космическое существо растёт и мутирует от твоей реальной еды, воды, сна и прогулок. Никогда не умирает." },
      { property: "og:title", content: "Астральный питомец" },
      { property: "og:description", content: "Тамагочи с дичинкой: генетика, мутации и мини-игры от настоящей заботы о себе." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const KEY = "astral-pet-v1";
type Save = { acts: Act[]; seed: number; name: string; journal: { at: number; text: string }[]; best: number };
const SPRITE = { egg, baby, adult };

function Index() {
  const [save, setSave] = useState<Save | null>(null);
  const [now, setNow] = useState(0);
  const [tab, setTab] = useState<"game" | "journal" | "ideas">("game");
  const [pop, setPop] = useState<string | null>(null);

  useEffect(() => {
    let s: Save | null = null;
    try { s = JSON.parse(localStorage.getItem(KEY) || "null"); } catch {}
    setSave(s ?? { acts: [], seed: Math.floor(Math.random() * 10000), name: "Бульк", journal: [], best: 0 });
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { if (save) localStorage.setItem(KEY, JSON.stringify(save)); }, [save]);

  const onGame = useCallback((score: number) => {
    setSave((s) => s && { ...s, best: Math.max(s.best, score) });
    setPop(score >= 15 ? "Я переливаюсь всеми цветами! ✨" : "Вкусные звёзды, спасибо 💫");
  }, []);

  if (!save) return <main className="min-h-screen" />;

  const xp = xpOf(save.acts);
  const stage = stageOf(xp);
  const env = environment(save.acts, now);
  const traits = activeTraits(env);
  const g = genes(save.seed);
  const food = save.acts.filter((a) => ["snack", "lunch", "warm", "soft"].includes(a.kind));
  const lastFood = food.length ? Math.max(...food.map((a) => a.at)) : null;
  const hours = lastFood ? (now - lastFood) / 3600_000 : null;
  const cocoon = stage !== "egg" && hours !== null && hours > 5;
  const next = STAGES.find((s) => s.from > xp);
  const today = save.acts.filter((a) => dayKey(a.at) === dayKey(now));

  const act = (kind: ActKind) => {
    const t = Date.now();
    setSave((s) => {
      if (!s) return s;
      const acts = [...s.acts, { kind, at: t }];
      const journal = [...s.journal];
      const before = stageOf(xpOf(s.acts)), after = stageOf(xpOf(acts));
      if (before !== after) journal.unshift({ at: t, text: `Метаморфоза! Теперь это ${STAGES.find((x) => x.id === after)!.name}.` });
      const was = activeTraits(environment(s.acts, t));
      for (const k of activeTraits(environment(acts, t))) if (!was.includes(k)) {
        const tr = TRAITS.find((x) => x.key === k)!;
        journal.unshift({ at: t, text: `Мутация: ${tr.icon} ${tr.name} (${tr.desc}).` });
      }
      return { ...s, acts, journal: journal.slice(0, 40) };
    });
    setNow(t);
    setPop(["Ням, энергия!", "Бульк-бульк ✨", "Чувствую рост…", "Спасибо, человек 💜"][Math.floor(Math.random() * 4)]!);
    setTimeout(() => setPop(null), 2400);
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl text-wood">✦ Астральный питомец ✦</h1>
          <p className="text-sm text-muted-foreground">Растёт от твоей настоящей заботы о себе. Никогда не умирает.</p>
        </div>
        <input value={save.name} onChange={(e) => setSave({ ...save, name: e.target.value.slice(0, 20) })}
          aria-label="Имя существа" className="pixel-box bg-card px-3 py-1 font-pixel w-40 text-center" />
      </header>

      <section className="grid md:grid-cols-[320px_1fr] gap-6 items-center pixel-box bg-card p-5">
        <div className="relative mx-auto w-64 h-64">
          {traits.includes("water") && <div className="absolute inset-0 text-2xl animate-bob pointer-events-none"><span className="absolute left-2 top-6">🫧</span><span className="absolute right-4 top-2">🫧</span><span className="absolute right-0 bottom-16">🫧</span></div>}
          {traits.includes("air") && stage !== "egg" && <span className="absolute left-1/2 -translate-x-1/2 -top-2 text-4xl z-10">🍄</span>}
          <img src={SPRITE[stage]} alt={STAGES.find((s) => s.id === stage)!.name} width={1024} height={1024}
            className={`w-full h-full object-contain ${cocoon ? "opacity-60 grayscale-[40%]" : "animate-bob"}`}
            style={{ filter: `hue-rotate(${g.hue}deg) saturate(${traits.includes("rest") ? 1.6 : 1}) drop-shadow(0 0 ${traits.includes("nourish") ? 24 : 6}px var(--primary))` }} />
          {traits.includes("rest") && <span className="absolute right-6 bottom-6 text-2xl animate-pulse">✨</span>}
          {cocoon && <span className="absolute inset-x-0 bottom-0 text-center text-xs font-pixel">💤 в коконе</span>}
        </div>
        <div className="space-y-4">
          <div className="pixel-box bg-background p-4 text-lg min-h-16">
            {pop ? <span className="animate-pop inline-block">{pop}</span> : petLine(hours, stage)}
          </div>
          <div className="text-sm space-y-1">
            <p><b className="font-pixel">{STAGES.find((s) => s.id === stage)!.name}</b> · характер: {g.temper} · глаз: {stage === "egg" ? "?" : g.eyes + 1}</p>
            <div className="h-3 pixel-box bg-muted p-0 overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${next ? Math.min(100, (xp / next.from) * 100) : 100}%` }} /></div>
            <p className="text-muted-foreground">{next ? `до стадии «${next.name}»: ${next.from - xp} очков роста` : "Полностью вырос. Мутации продолжаются!"}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {TRAITS.map((t) => (
              <div key={t.key} title={t.desc} className={`rounded-md border-2 border-input p-2 ${traits.includes(t.key) ? "bg-accent" : "bg-background"}`}>
                <div className="flex justify-between"><span>{t.icon} {t.name}</span><span className="font-pixel">{Math.round(env[t.key] * 100)}%</span></div>
                <div className="h-1.5 bg-muted rounded mt-1 overflow-hidden"><div className="h-full bg-primary" style={{ width: `${env[t.key] * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl mb-1">Что ты сделала для себя?</h2>
        <p className="text-sm text-muted-foreground mb-3">Каждое действие питает существо. Среда за 3 дня решает, какие мутации проявятся.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ACTIONS.map((a) => (
            <button key={a.kind} onClick={() => act(a.kind)}
              className="pixel-box bg-card p-3 flex flex-col items-center gap-1 hover:-translate-y-1 active:translate-y-0.5 transition-transform">
              <span className="text-3xl">{a.icon}</span><span className="font-semibold text-sm text-center">{a.label}</span>
            </button>
          ))}
        </div>
        {today.length > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">Сегодня: {today.map((e) => ACTIONS.find((x) => x.kind === e.kind)?.icon).join(" ")}
            <button onClick={() => setSave({ ...save, acts: save.acts.slice(0, -1) })} className="underline ml-3">отменить последнее</button></p>
        )}
      </section>

      <section className="pixel-box bg-card p-5">
        <div className="flex gap-2 mb-4 flex-wrap">
          {([["game", "🌠 Ловля звёзд"], ["journal", "📜 Гримуар мутаций"], ["ideas", "🫙 Перекусы"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`font-pixel px-3 py-1 rounded ${tab === k ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{l}</button>
          ))}
        </div>
        {tab === "game" && <><StarCatch onDone={onGame} />{save.best > 0 && <p className="text-xs text-center text-muted-foreground mt-2">Рекорд: {save.best}</p>}</>}
        {tab === "journal" && (save.journal.length ? (
          <ul className="space-y-2">{save.journal.map((j, i) => <li key={i} className="rounded border-2 border-input bg-background p-2 text-sm"><span className="text-muted-foreground mr-2">{new Date(j.at).toLocaleDateString("ru-RU")}</span>{j.text}</li>)}</ul>
        ) : <p className="text-muted-foreground">Пока пусто. Первые метаморфозы появятся здесь.</p>)}
        {tab === "ideas" && (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {IDEAS.map((i) => <div key={i.t} className="rounded-lg border-2 border-input bg-background p-3"><p className="font-bold">{i.t}</p><p className="text-sm text-muted-foreground">{i.d}</p></div>)}
          </div>
        )}
      </section>

      <footer className="text-center text-xs text-muted-foreground pb-4">Без калорий, весов и штрафов. Пропустила день — существо просто дремлет в коконе 🌙</footer>
    </main>
  );
}
