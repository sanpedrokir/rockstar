"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Lane = 0 | 1 | 2 | 3;

type Note = {
  id: number;
  lane: Lane;
  y: number; // 0 (top) to 100 (hit line)
};

const LANE_KEYS = ["D", "F", "J", "K"] as const;
const LANE_COLORS = [
  "bg-red-500",
  "bg-yellow-400",
  "bg-blue-500",
  "bg-green-500",
] as const;
const GAME_SECONDS = 60;
const HIT_WINDOW = 8; // how close to the hit line (in %) counts as a hit
const NOTE_SPEED = 1.1; // % per tick
const SPAWN_INTERVAL_MS = 550;
// Low E-A-D-G guitar string pitches, one per lane
const LANE_FREQS = [82.41, 110.0, 146.83, 196.0] as const;

export default function RockAndRollGame() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [status, setStatus] = useState<"idle" | "playing" | "over">("idle");
  const [flash, setFlash] = useState<Lane | null>(null);

  const noteId = useRef(0);
  const notesRef = useRef<Note[]>([]);
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playTone = useCallback(
    (lane: Lane) => {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = LANE_FREQS[lane];

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1200;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    },
    [getAudioContext]
  );

  const startGame = useCallback(() => {
    getAudioContext();
    setNotes([]);
    setScore(0);
    setCombo(0);
    setMisses(0);
    setTimeLeft(GAME_SECONDS);
    setStatus("playing");
  }, [getAudioContext]);

  // spawn notes
  useEffect(() => {
    if (status !== "playing") return;
    const spawn = setInterval(() => {
      const lane = Math.floor(Math.random() * 4) as Lane;
      noteId.current += 1;
      setNotes((prev) => [...prev, { id: noteId.current, lane, y: 0 }]);
    }, SPAWN_INTERVAL_MS);
    return () => clearInterval(spawn);
  }, [status]);

  // move notes + detect misses
  useEffect(() => {
    if (status !== "playing") return;
    let frame: number;
    const tick = () => {
      setNotes((prev) => {
        const next: Note[] = [];
        let missed = 0;
        for (const n of prev) {
          const y = n.y + NOTE_SPEED;
          if (y > 100 + HIT_WINDOW) {
            missed += 1;
          } else {
            next.push({ ...n, y });
          }
        }
        if (missed > 0) {
          setMisses((m) => m + missed);
          setCombo(0);
        }
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [status]);

  // countdown
  useEffect(() => {
    if (status !== "playing") return;
    const t = setTimeout(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          setStatus("over");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [status, timeLeft]);

  const hitLane = useCallback((lane: Lane) => {
    setFlash(lane);
    setTimeout(() => setFlash((cur) => (cur === lane ? null : cur)), 100);

    const candidates = notesRef.current.filter(
      (n) => n.lane === lane && Math.abs(n.y - 100) <= HIT_WINDOW
    );
    if (candidates.length === 0) return;

    const best = candidates.reduce((a, b) =>
      Math.abs(a.y - 100) < Math.abs(b.y - 100) ? a : b
    );
    setNotes((prev) => prev.filter((n) => n.id !== best.id));
    setCombo((c) => c + 1);
    setScore((s) => s + 10 + Math.min(combo, 20));
    playTone(lane);
  }, [combo, playTone]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const idx = LANE_KEYS.indexOf(
        e.key.toUpperCase() as (typeof LANE_KEYS)[number]
      );
      if (idx === -1) return;
      hitLane(idx as Lane);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hitLane]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-black text-white font-sans px-4 py-10 gap-6">
      <h1 className="text-4xl font-extrabold tracking-tight text-center">
        🎸 Rock &amp; Roll Hero
      </h1>
      <p className="text-zinc-400 text-center max-w-md">
        Hit <span className="font-mono">D</span> <span className="font-mono">F</span>{" "}
        <span className="font-mono">J</span> <span className="font-mono">K</span> when the
        notes reach the bottom line. Keep the combo alive!
      </p>
      <Link
        href="/game/guess"
        className="rounded-full border border-zinc-600 px-5 py-2 text-sm font-semibold hover:bg-zinc-800 transition-colors"
      >
        🎤 Guess the Song (multiplayer)
      </Link>

      <div className="flex gap-8 text-lg font-mono">
        <span>Score: {score}</span>
        <span>Combo: {combo}</span>
        <span>Misses: {misses}</span>
        <span>Time: {timeLeft}s</span>
      </div>

      <div className="relative w-full max-w-md h-[420px] bg-zinc-900 border-2 border-zinc-700 rounded-lg overflow-hidden">
        {[0, 1, 2, 3].map((lane) => (
          <div
            key={lane}
            className="absolute top-0 bottom-0 border-r border-zinc-800 last:border-r-0"
            style={{ left: `${lane * 25}%`, width: "25%" }}
          >
            {notes
              .filter((n) => n.lane === lane)
              .map((n) => (
                <div
                  key={n.id}
                  className={`absolute left-1/2 -translate-x-1/2 w-12 h-4 rounded ${LANE_COLORS[lane]}`}
                  style={{ top: `${n.y}%` }}
                />
              ))}
          </div>
        ))}

        {/* hit line */}
        <div className="absolute left-0 right-0 bottom-10 h-1 bg-white/70" />

        {/* lane key hints */}
        <div className="absolute left-0 right-0 bottom-0 h-10 flex">
          {LANE_KEYS.map((key, lane) => (
            <div
              key={key}
              className={`flex-1 flex items-center justify-center border-t border-zinc-700 font-mono font-bold transition-colors ${
                flash === lane ? LANE_COLORS[lane] + " text-black" : "text-zinc-500"
              }`}
            >
              {key}
            </div>
          ))}
        </div>

        {status !== "playing" && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
            {status === "over" && (
              <p className="text-2xl font-bold">Final Score: {score}</p>
            )}
            <button
              onClick={startGame}
              className="rounded-full bg-white text-black px-6 py-3 font-semibold hover:bg-zinc-200 transition-colors"
            >
              {status === "over" ? "Play Again" : "Start Game"}
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {LANE_KEYS.map((key, lane) => (
          <button
            key={key}
            onClick={() => hitLane(lane as Lane)}
            className={`w-14 h-14 rounded-full font-mono font-bold text-black ${LANE_COLORS[lane]} active:scale-95 transition-transform`}
          >
            {key}
          </button>
        ))}
      </div>
      <p className="text-zinc-500 text-sm">(Tap the buttons above on mobile/touch devices)</p>
    </div>
  );
}
