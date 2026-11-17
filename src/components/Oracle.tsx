import { useEffect, useState } from "react";
import { MODEL_OPTIONS, chat, detectService, endpoint, type AiSettings, type Msg } from "@/lib/ai";
import { KETONE_LEVELS, MODES, applyMode, contextFor, defaultProfile, doctorSheet, longGaps, type Measure, type Mode, type Profile } from "@/lib/health";

const KEY = "astral-oracle-v1";
type Store = { profile: Profile; ai: AiSettings; measures: Measure[]; msgs: Msg[] };
const QUICK = [
  "🌙 Что съесть на ночь, чтобы утром не было кетонов?",
  "🥑 Нет аппетита, но пора поесть — что легко зайдёт?",
  "📉 Сахар на датчике скачет — что сделать прямо сейчас?",
  "🧘 Мягкая разминка на 10 минут?",
];
const SYSTEM = (ctx: string) => `Ты — бережный советник по питанию, сну и движению в уютном приложении-тамагочи. Отвечай по-русски, тепло, коротко (до 120 слов), без стыда, нотаций, калорий и диет. Давай 2–3 конкретных варианта. Учитывай контекст пользователя. Ты не врач: при тревожных симптомах мягко советуй связаться с врачом.\n\nКонтекст:\n${ctx}`;
const fmt = (t: number) => new Date(t).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

export function Oracle({ meals, now }: { meals: number[]; now: number }) {
  const [s, setS] = useState<Store | null>(null);
  const [view, setView] = useState<"talk" | "profile" | "sheet">("talk");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [glu, setGlu] = useState("");
  const [check, setCheck] = useState("");

  useEffect(() => {
    let v: Store | null = null;
    try { v = JSON.parse(localStorage.getItem(KEY) || "null"); } catch {}
    setS(v ?? { profile: defaultProfile(), ai: { apiKey: "", model: "" }, measures: [], msgs: [] });
  }, []);
  useEffect(() => { if (s) localStorage.setItem(KEY, JSON.stringify(s)); }, [s]);
  if (!s) return null;

  const p = s.profile;
  const setP = (x: Partial<Profile>) => setS({ ...s, profile: { ...p, ...x } });
  const setAi = (x: Partial<AiSettings>) => setS({ ...s, ai: { ...s.ai, ...x } });
  const addM = (kind: Measure["kind"], value: string) => setS({ ...s, measures: [...s.measures, { at: Date.now(), kind, value }].slice(-500) });
  const ep = endpoint(s.ai);
  const svc = detectService(s.ai.apiKey);
  const last = meals.length ? Math.max(...meals) : null;
  const since = last ? (now - last) / 3600_000 : null;
  const gaps = longGaps(meals.filter((t) => t > now - 86400_000), p.gapHours);

  const ask = async (q: string) => {
    if (!q.trim() || busy) return;
    if (!ep) { setErr("Сначала добавьте ключ ИИ в «Профиле»."); return; }
    const msgs: Msg[] = [...s.msgs, { role: "user", content: q.trim() }];
    setS({ ...s, msgs }); setInput(""); setErr(""); setBusy(true);
    try {
      const a = await chat(ep, SYSTEM(contextFor(p, meals, s.measures, Date.now())), msgs.slice(-12));
      setS((x) => x && { ...x, msgs: [...msgs, { role: "assistant" as const, content: a }].slice(-40) });
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    setBusy(false);
  };

  const status = since === null ? "Ещё нет отметок еды." : since > p.gapHours
    ? `С еды прошло ${since.toFixed(1)} ч — самое время мягко подкрепиться 💜`
    : `С еды прошло ${since.toFixed(1)} ч из комфортных ${p.gapHours} ч ✨`;

  const views: [typeof view, string][] = [["talk", "🔮 Совет"], ["profile", "⚙️ Профиль"], ["sheet", "📋 Для врача"]];

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-3 gap-1.5 print:hidden">
        {views.map(([k, l]) => <button key={k} onClick={() => setView(k)} className={`pixel-box py-2 text-xs font-pixel ${view === k ? "bg-primary text-primary-foreground" : "bg-card"}`}>{l}</button>)}
      </div>

      {view === "talk" && (<>
        <div className="pixel-box bg-card p-3 text-sm space-y-2">
          <p className="font-pixel text-xs text-muted-foreground">{MODES[p.mode].icon} {MODES[p.mode].label}</p>
          <p>{status}</p>
          {gaps.length > 0 && <p className="text-xs text-muted-foreground">За сутки длинных пауз днём: {gaps.length} (самая {Math.max(...gaps.map((g) => g.hours))} ч). Без паники — просто заметка.</p>}
          {(p.ketones || p.glucose) && <div className="flex flex-wrap gap-1.5 pt-1">
            {p.ketones && KETONE_LEVELS.map((k) => <button key={k} onClick={() => addM("ketone", k)} className="rounded border border-border px-2 py-1 text-xs">кетоны {k}</button>)}
            {p.glucose && <form className="flex gap-1" onSubmit={(e) => { e.preventDefault(); if (glu.trim()) { addM("glucose", glu.trim().replace(",", ".")); setGlu(""); } }}>
              <input value={glu} onChange={(e) => setGlu(e.target.value)} inputMode="decimal" placeholder="сахар, ммоль/л" className="w-28 rounded border border-border bg-background px-2 py-1 text-xs" />
              <button className="rounded border border-border px-2 text-xs">+</button></form>}
          </div>}
          {s.measures.length > 0 && <p className="text-[11px] text-muted-foreground">Последнее: {s.measures.slice(-3).map((m) => `${fmt(m.at)} ${m.kind === "ketone" ? "кетоны " : "сахар "}${m.value}`).join(" · ")}</p>}
        </div>
        <div className="grid grid-cols-2 gap-1.5">{QUICK.map((q) => <button key={q} onClick={() => ask(q)} disabled={busy} className="pixel-box bg-card p-2 text-left text-xs disabled:opacity-50">{q}</button>)}</div>
        <div className="space-y-2">{s.msgs.map((m, i) => (
          <div key={i} className={`pixel-box p-2 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-muted ml-8" : "bg-card mr-4"}`}>{m.content}</div>))}
          {busy && <p className="text-xs text-muted-foreground animate-pulse">Оракул заваривает ответ…</p>}
          {err && <p className="text-xs text-destructive">{err}</p>}
        </div>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Спросить о еде, сне, движении…" className="flex-1 pixel-box bg-card px-3 py-2 text-sm outline-none" />
          <button disabled={busy} className="pixel-box bg-primary text-primary-foreground px-3 font-pixel">➤</button>
        </form>
        {s.msgs.length > 0 && <button onClick={() => setS({ ...s, msgs: [] })} className="text-xs underline text-muted-foreground">очистить диалог</button>}
      </>)}

      {view === "profile" && (
        <div className="pixel-box bg-card p-3 space-y-3 text-sm">
          <label className="block">Как к тебе обращаться
            <input value={p.name} onChange={(e) => setP({ name: e.target.value.slice(0, 30) })} className="mt-1 w-full rounded border border-border bg-background px-2 py-1" /></label>
          <div className="grid grid-cols-2 gap-1.5">{(Object.keys(MODES) as Mode[]).map((m) => (
            <button key={m} onClick={() => setS({ ...s, profile: applyMode(p, m) })} className={`rounded border p-2 text-xs ${p.mode === m ? "border-primary bg-primary/15" : "border-border"}`}>{MODES[m].icon} {MODES[m].label}</button>))}</div>
          <label className="block">Комфортная пауза между едой: <b>{p.gapHours} ч</b>
            <input type="range" min={2} max={6} step={0.5} value={p.gapHours} onChange={(e) => setP({ gapHours: +e.target.value })} className="w-full" /></label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={p.ketones} onChange={(e) => setP({ ketones: e.target.checked })} /> Отмечать кетоны</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={p.glucose} onChange={(e) => setP({ glucose: e.target.checked })} /> Показания датчика глюкозы</label>
          <label className="block">Мои особенности питания (видит только советник)
            <textarea value={p.notes} onChange={(e) => setP({ notes: e.target.value.slice(0, 500) })} rows={3} placeholder="например: вегетарианка, не ем глютен, тошнит по утрам" className="mt-1 w-full rounded border border-border bg-background px-2 py-1" /></label>

          <div className="border-t border-border pt-3 space-y-2">
            <p className="font-pixel text-xs">🔑 ИИ-советник (свой ключ)</p>
            <input type="password" value={s.ai.apiKey} placeholder="sk-… / sk-or-… / AIza… / sk-ant-…"
              onChange={(e) => { const k = e.target.value; const ch = detectService(k)?.name !== svc?.name; setAi({ apiKey: k, ...(ch ? { model: "" } : {}) }); }}
              className="w-full rounded border border-border bg-background px-2 py-1" />
            {s.ai.apiKey.trim() && <p className="text-xs text-muted-foreground">{svc ? `Узнала: ${svc.name}.` : "Не узнаю ключ. Подходят OpenAI, OpenRouter, Gemini, Groq, Anthropic, DeepSeek, xAI, Claude n Codex."}</p>}
            {svc && <>
              <select value={MODEL_OPTIONS[svc.name]?.models.includes(s.ai.model) || !s.ai.model ? s.ai.model : "__own"} onChange={(e) => setAi({ model: e.target.value === "__own" ? " " : e.target.value })}
                className="w-full rounded border border-border bg-background px-2 py-1">
                <option value="">Рекомендуемая · {svc.model}</option>
                {MODEL_OPTIONS[svc.name]?.models.filter((m) => m !== svc.model).map((m) => <option key={m} value={m}>{m}</option>)}
                <option value="__own">Своя модель…</option>
              </select>
              {s.ai.model && !MODEL_OPTIONS[svc.name]?.models.includes(s.ai.model) && <input value={s.ai.model.trim()} onChange={(e) => setAi({ model: e.target.value || " " })} placeholder="название модели" className="w-full rounded border border-border bg-background px-2 py-1" />}
              <input value={s.ai.baseUrl ?? ""} onChange={(e) => setAi({ baseUrl: e.target.value })} placeholder="Свой адрес API (необязательно)" className="w-full rounded border border-border bg-background px-2 py-1 text-xs" />
              <div className="flex items-center gap-2">
                <button onClick={async () => { setCheck("Проверяю…"); try { await chat(ep!, "Ответь одним словом: OK.", [{ role: "user", content: "Проверка" }], 20); setCheck(`✓ ${ep!.name} · ${ep!.model} отвечает`); } catch (e) { setCheck(e instanceof Error ? e.message : String(e)); } }}
                  className="rounded border border-border px-2 py-1 text-xs">Проверить подключение</button>
                {MODEL_OPTIONS[svc.name] && <a href={MODEL_OPTIONS[svc.name]!.keysUrl} target="_blank" rel="noreferrer" className="text-xs underline">где взять ключ</a>}
              </div>
              {check && <p className="text-xs">{check}</p>}
            </>}
            <p className="text-[11px] text-muted-foreground">Ключ хранится только на этом устройстве и отправляется напрямую выбранному сервису.</p>
          </div>
        </div>
      )}

      {view === "sheet" && (
        <div className="pixel-box bg-card p-3 text-xs space-y-2 print:shadow-none print:border-0">
          <div className="flex justify-between items-center">
            <p className="font-bold text-sm">Дневник пауз в питании{p.name ? ` · ${p.name}` : ""}</p>
            <button onClick={() => window.print()} className="rounded border border-border px-2 py-1 print:hidden">🖨️ Печать / PDF</button>
          </div>
          <p className="text-muted-foreground">Комфортный интервал: до {p.gapHours} ч. Ночная пауза — от последней еды вечером до завтрака.</p>
          <table className="w-full border-collapse">
            <thead><tr className="text-left border-b border-border"><th className="py-1">Дата</th><th>Еда</th><th>Макс. пауза днём</th><th>Ночь</th>{p.ketones && <th>Кетоны</th>}{p.glucose && <th>Сахар</th>}</tr></thead>
            <tbody>{doctorSheet(meals, s.measures, 14, now).map((r) => (
              <tr key={r.day} className="border-b border-border/50 align-top">
                <td className="py-1 whitespace-nowrap">{r.day.slice(5)}</td>
                <td>{r.meals.map(fmt).join(", ") || "—"}</td>
                <td className={r.maxGap > p.gapHours ? "font-bold" : ""}>{r.maxGap ? `${r.maxGap} ч` : "—"}</td>
                <td>{r.night !== null ? `${r.night} ч` : "—"}</td>
                {p.ketones && <td>{r.ketones.join(", ") || "—"}</td>}
                {p.glucose && <td>{r.glucose.join(", ") || "—"}</td>}
              </tr>))}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
