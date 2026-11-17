import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import egg from "@/assets/pet-egg.png";
import baby from "@/assets/pet-baby.png";
import adult from "@/assets/pet-adult.png";
import { IDEAS, dayKey } from "@/lib/care";
import { ACTIONS, STAGES, TRAITS, activeTraits, environment, genes, petLine, stageOf, xpOf, type Act, type ActKind } from "@/lib/pet";
import { phaseAt, sleepQuality } from "@/lib/sleep";
import { chronicleLine } from "@/lib/chronicle";
import { buildLayers, type Layer } from "@/lib/layers";
import { StarCatch } from "@/components/StarCatch";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Астральный тамагочи — расти существо заботой о себе" },
      { name: "description", content: "Карманное космическое существо растёт и мутирует от твоей еды, воды, сна и прогулок. Ночью спит вместе с тобой." },
      { property: "og:title", content: "Астральный тамагочи" },
      { property: "og:description", content: "Тамагочи с дичинкой: мутации-конструктор, хроники в духе Годвилля и ночной сон." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const KEY = "astral-pet-v1";
type Save = { acts: Act[]; seed: number; name: string; journal: { at: number; text: string }[]; best: number; sleepStart?: number | null };
const SPRITE = { egg, baby, adult };
const POS: Record<Layer["slot"], string> = {
  bg: "inset-0", aura: "left-1 top-4 text-2xl", body: "", eyes: "left-1/2 -translate-x-1/2 top-[30%] text-lg",
  head: "left-1/2 -translate-x-1/2 -top-3 text-4xl", hands: "right-2 bottom-10 text-3xl -rotate-12", night: "right-1 top-1 text-3xl",
};
type Tab = "care" | "chron" | "play" | "ideas";

function Index() {
  const [save, setSave] = useState<Save | null>(null);
  const [now, setNow] = useState(0);
  const [tab, setTab] = useState<Tab>("care");
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

  const say = (t: string) => { setPop(t); setTimeout(() => setPop(null), 3000); };
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
  const phase = phaseAt(now);
  const asleep = !!save.sleepStart;
  const food = save.acts.filter((a) => ["snack", "lunch", "warm", "soft"].includes(a.kind));
  const lastFood = food.length ? Math.max(...food.map((a) => a.at)) : null;
  const hours = lastFood ? (now - lastFood) / 3600_000 : null;
  const cocoon = stage !== "egg" && !asleep && phase === "day" && hours !== null && hours > 5;
  const next = STAGES.find((s) => s.from > xp);
  const today = save.acts.filter((a) => dayKey(a.at) === dayKey(now));
  const layers = stage === "egg" ? buildLayers({ traits: [], phase, asleep, cocoon: false, eyes: 1 }) : buildLayers({ traits, phase, asleep, cocoon, eyes: g.eyes + 1 });
  const dark = asleep || phase === "night";

  const line = asleep ? "Zzz… мне снится, что ты тоже спишь. Это лучший сон 🌙"
    : phase === "night" ? "Ш-ш-ш… ты чего не спишь, звёздочка? Давай погасим свет — я укутаюсь в плед."
    : phase === "drowsy" ? "Глаза слипаются… давай дочитаем главу уже завтра?"
    : petLine(hours, stage);

  const log = (s: Save, t: number, text: string) => ({ ...s, journal: [{ at: t, text }, ...s.journal].slice(0, 60) });

  const act = (kind: ActKind) => {
    const t = Date.now();
    setSave((s) => {
      if (!s) return s;
      const acts = [...s.acts, { kind, at: t }];
      let n: Save = log({ ...s, acts }, t, chronicleLine(kind, Math.random()));
      const before = stageOf(xpOf(s.acts)), after = stageOf(xpOf(acts));
      if (before !== after) n = log(n, t, `✦ Метаморфоза! Теперь это ${STAGES.find((x) => x.id === after)!.name}.`);
      const was = activeTraits(environment(s.acts, t));
      for (const k of activeTraits(environment(acts, t))) if (!was.includes(k)) {
        const tr = TRAITS.find((x) => x.key === k)!;
        n = log(n, t, `${tr.icon} Мутация «${tr.name}»: ${tr.desc}.`);
      }
      return n;
    });
    setNow(t);
    say(["Ням, энергия!", "Бульк-бульк ✨", "Чувствую рост…", "Спасибо, человек 💜"][Math.floor(Math.random() * 4)]!);
  };

  const lightsOut = () => { const t = Date.now(); setSave((s) => s && log({ ...s, sleepStart: t }, t, "Свет погашен. Укутался в звёздный плед.")); setNow(t); };
  const wakeUp = () => {
    const t = Date.now();
    setSave((s) => {
      if (!s?.sleepStart) return s;
      const q = sleepQuality(s.sleepStart, t);
      const h = Math.round((t - s.sleepStart) / 3600_000 * 10) / 10;
      const base = { ...s, sleepStart: null, acts: q === "long" ? [...s.acts, { kind: "sleep" as const, at: t }] : s.acts };
      return log(base, t, q === "long" ? `Хозяйка проспала ${h} ч. Проснулся сияющим, вокруг сонные кристаллы маны (+рост).` : `Поспали ${h} ч. Немного помятый, но рад тебя видеть.`);
    });
    setNow(t);
  };

  const tabs: [Tab, string, string][] = [["care", "🍙", "Забота"], ["chron", "📜", "Хроники"], ["play", "🌠", "Игры"], ["ideas", "🫙", "Идеи"]];

  return (
    <main className="mx-auto max-w-md px-3 py-4 pb-24 space-y-4">
      <div className="device p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <input value={save.name} onChange={(e) => setSave({ ...save, name: e.target.value.slice(0, 20) })} aria-label="Имя существа"
            className="bg-transparent font-pixel text-lg w-32 outline-none" />
          <span className="font-pixel text-sm">{new Date(now).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })} {dark ? "🌙" : phase === "drowsy" ? "🌆" : "☀️"}</span>
        </div>

        <div className="flex justify-between text-xs font-pixel">
          {TRAITS.map((t) => (
            <span key={t.key} title={t.name} className={traits.includes(t.key) ? "" : "opacity-40"}>{t.icon} {Math.round(env[t.key] * 100)}%</span>
          ))}
        </div>

        <div className={`lcd ${dark ? "lcd-night" : ""} p-3 transition-all duration-700`}>
          <div className="relative mx-auto w-52 h-52">
            {layers.filter((l) => l.slot === "aura").map((l, i) => <span key={l.id} className={`absolute animate-bob ${i ? "right-1 bottom-12 text-3xl" : POS.aura}`}>{l.glyph}</span>)}
            <img src={SPRITE[stage]} alt={STAGES.find((s) => s.id === stage)!.name} width={1024} height={1024}
              className={`w-full h-full object-contain transition-all duration-700 ${asleep || cocoon ? "opacity-70 scale-95" : phase === "drowsy" ? "" : "animate-bob"}`}
              style={{ filter: `hue-rotate(${g.hue}deg) saturate(${traits.includes("rest") ? 1.6 : 1}) brightness(${dark ? 0.75 : 1})` }} />
            {layers.filter((l) => l.slot !== "aura").map((l) => <span key={l.id} className={`absolute ${POS[l.slot]} ${l.slot === "night" ? "animate-pulse" : ""}`}>{l.glyph}</span>)}
          </div>
          <p className="text-center text-sm min-h-12 mt-1">{pop ? <span className="animate-pop inline-block">{pop}</span> : line}</p>
        </div>

        <div className="text-xs space-y-1">
          <div className="flex justify-between"><b className="font-pixel">{STAGES.find((s) => s.id === stage)!.name}</b><span>{g.temper}</span></div>
          <div className="h-2.5 rounded bg-muted overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${next ? Math.min(100, (xp / next.from) * 100) : 100}%` }} /></div>
        </div>

        {asleep
          ? <button onClick={wakeUp} className="w-full pixel-box bg-card py-3 font-pixel">☀️ Доброе утро</button>
          : (phase !== "day") && <button onClick={lightsOut} className="w-full pixel-box bg-primary text-primary-foreground py-3 font-pixel">🌙 Погасить свет · баиньки</button>}
      </div>

      {tab === "care" && (
        <section className="space-y-2">
          <div className="grid grid-cols-4 gap-2">
            {ACTIONS.map((a) => (
              <button key={a.kind} onClick={() => act(a.kind)} disabled={asleep}
                className="pixel-box bg-card p-2 flex flex-col items-center gap-0.5 active:translate-y-0.5 transition-transform disabled:opacity-40">
                <span className="text-2xl">{a.icon}</span><span className="text-[11px] leading-tight text-center">{a.label}</span>
              </button>
            ))}
          </div>
          {today.length > 0 && (
            <p className="text-xs text-muted-foreground">Сегодня: {today.map((e) => ACTIONS.find((x) => x.kind === e.kind)?.icon).join(" ")}
              <button onClick={() => setSave({ ...save, acts: save.acts.slice(0, -1) })} className="underline ml-2">отменить</button></p>
          )}
        </section>
      )}
      {tab === "chron" && (save.journal.length ? (
        <ul className="space-y-2">{save.journal.map((j, i) => (
          <li key={i} className="pixel-box bg-card p-2 text-sm"><span className="font-pixel text-xs text-muted-foreground mr-2">
            {new Date(j.at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>{j.text}</li>
        ))}</ul>
      ) : <p className="text-muted-foreground text-sm">Хроники пусты. Сделай что-нибудь для себя — и {save.name} начнёт творить дичь.</p>)}
      {tab === "play" && <div className="pixel-box bg-card p-3"><StarCatch onDone={onGame} />{save.best > 0 && <p className="text-xs text-center text-muted-foreground mt-2">Рекорд: {save.best}</p>}</div>}
      {tab === "ideas" && <div className="grid grid-cols-2 gap-2">{IDEAS.map((i) => <div key={i.t} className="pixel-box bg-card p-2"><p className="font-bold text-sm">{i.t}</p><p className="text-xs text-muted-foreground">{i.d}</p></div>)}</div>}

      <nav className="fixed bottom-0 inset-x-0 z-20 bg-card/95 backdrop-blur border-t-4 border-border">
        <div className="mx-auto max-w-md grid grid-cols-4">
          {tabs.map(([k, ic, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`py-2 flex flex-col items-center text-xs font-pixel ${tab === k ? "text-primary" : "text-muted-foreground"}`}>
              <span className="text-xl">{ic}</span>{l}</button>
          ))}
        </div>
      </nav>
    </main>
  );
}
