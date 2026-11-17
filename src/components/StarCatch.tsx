import { useEffect, useRef, useState } from "react";

type Star = { id: number; x: number; y: number; e: string };
const ICONS = ["⭐", "🌟", "🍙", "🫧", "🍡", "💫"];

/** 20-second calm mini-game: tap drifting stars to feed the creature's glow. */
export function StarCatch({ onDone }: { onDone: (score: number) => void }) {
  const [stars, setStars] = useState<Star[]>([]);
  const [left, setLeft] = useState(20);
  const [score, setScore] = useState(0);
  const [on, setOn] = useState(false);
  const id = useRef(0);

  useEffect(() => {
    if (!on) return;
    const spawn = setInterval(() => {
      setStars((s) => [...s.slice(-7), { id: id.current++, x: 5 + Math.random() * 85, y: 5 + Math.random() * 75, e: ICONS[Math.floor(Math.random() * ICONS.length)]! }]);
    }, 650);
    const tick = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => { clearInterval(spawn); clearInterval(tick); };
  }, [on]);

  useEffect(() => {
    if (on && left <= 0) { setOn(false); setStars([]); onDone(score); }
  }, [left, on, score, onDone]);

  if (!on)
    return (
      <div className="text-center space-y-3 py-6">
        <p className="text-muted-foreground">Лови звёзды и онигири, пока они парят. 20 секунд, без проигрыша.</p>
        {score > 0 && <p className="font-pixel text-primary">Поймано: {score} ✦</p>}
        <button onClick={() => { setScore(0); setLeft(20); setOn(true); }} className="pixel-box bg-primary text-primary-foreground px-5 py-2 font-pixel">Начать ловлю</button>
      </div>
    );
  return (
    <div className="relative h-72 rounded-lg bg-background/60 overflow-hidden border-2 border-input">
      <div className="absolute top-2 left-3 font-pixel text-sm">✦ {score} · {left}с</div>
      {stars.map((s) => (
        <button key={s.id} aria-label="звезда" onClick={() => { setScore((n) => n + 1); setStars((all) => all.filter((x) => x.id !== s.id)); }}
          className="absolute text-4xl animate-pop hover:scale-125 transition-transform" style={{ left: `${s.x}%`, top: `${s.y}%` }}>{s.e}</button>
      ))}
    </div>
  );
}
