"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { DIFFICULTIES, GENRES, type Difficulty, type Genre, type Song } from "@/app/lib/songs";
import { midiToFreq, pluckString, makeOverdriveCurve, makeReverbImpulse } from "@/app/lib/guitarSynth";

const CLIP_MS = 10000; // mirrors app/lib/room.ts CLIP_MS
const POLL_MS = 1200;
const RIFF_BEATS = 20;
const BEAT_MS = CLIP_MS / RIFF_BEATS;
const PLAYER_COUNTS = [1, 2, 3, 4, 5] as const; // mirrors MIN/MAX_PLAYERS in app/lib/room.ts

type You = { accountId: number; gameName: string };
type Player = { id: number; accountId: number; gameName: string; score: number };
type RoundView = {
  roundNumber: number;
  songId: number;
  options: Song[];
  startedAt: string;
  phase: "clip" | "guessing" | "reveal";
  yourGuessSongId: number | null;
  revealed: boolean;
  guesses: { roomPlayerId: number; songId?: number; isCorrect?: boolean }[];
};
type RoomState = {
  code: string;
  status: "lobby" | "active" | "finished";
  difficulty: Difficulty;
  genre: Genre;
  maxPlayers: number;
  totalRounds: number;
  currentRoundNumber: number;
  hostAccountId: number;
  you: You & { isHost: boolean };
  players: Player[];
  round: RoundView | null;
};

// ---------------------------------------------------------------------------
// Guitar synth: Karplus-Strong plucked-string physical model instead of a
// bare oscillator, so it sounds like a struck/picked string rather than a
// digital tone. Rendered up front into a buffer (not real-time nodes) so a
// whole riff is just one AudioBufferSourceNode.
// ---------------------------------------------------------------------------

function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function renderRiffBuffer(ctx: AudioContext, songId: number) {
  const rand = seededRandom(songId * 2654435761);
  const rootMidi = 40 + Math.floor(rand() * 7); // roughly E2-B2, low guitar register
  const scale = [0, 3, 5, 7, 8, 10]; // minor pentatonic + b6, classic rock riff flavor
  const sampleRate = ctx.sampleRate;
  const samplesPerBeat = Math.round((sampleRate * BEAT_MS) / 1000);
  const total = samplesPerBeat * RIFF_BEATS;
  const mix = new Float32Array(total);

  for (let beat = 0; beat < RIFF_BEATS; beat++) {
    const isRest = rand() < 0.15;
    if (isRest) continue;
    const interval = scale[Math.floor(rand() * scale.length)];
    const accent = rand() < 0.3 ? 1.35 : 1;
    const freq = midiToFreq(rootMidi + interval);
    const noteLen = Math.floor(samplesPerBeat * 0.92); // slight palm-mute gap between hits
    const offset = beat * samplesPerBeat;

    const root = pluckString(freq, noteLen, sampleRate, 0.988, rand);
    const fifth = pluckString(freq * Math.pow(2, 7 / 12), noteLen, sampleRate, 0.985, rand);
    for (let i = 0; i < noteLen; i++) {
      mix[offset + i] += accent * (root[i] * 0.8 + fifth[i] * 0.45);
    }
  }

  const buffer = ctx.createBuffer(1, total, sampleRate);
  buffer.copyToChannel(mix, 0);
  return buffer;
}

// A "sung" layer: vibrato-modulated tone pushed through vowel-formant bandpass
// filters, so it reads as a voice riding over the riff rather than another
// plain oscillator. Real vocal audio for these (copyrighted) songs isn't
// something we have licensed samples for, so this is a synthesized stand-in.
function playVocalLayer(
  ctx: AudioContext,
  songId: number,
  startTime: number,
  destination: AudioNode,
  reverb: AudioNode | null
): { stop: () => void } {
  const rand = seededRandom(songId * 40503 + 7);
  const activeOscillators: OscillatorNode[] = [];
  const vocalRootMidi = 57 + Math.floor(rand() * 12); // ~A3-G#4, rock vocal range
  const scale = [0, 2, 3, 5, 7, 9, 10];
  const noteCount = 6;
  const noteDur = CLIP_MS / 1000 / noteCount;
  const formants = [700, 1200, 2600]; // rough "ah" vowel formants

  const vocalMaster = ctx.createGain();
  vocalMaster.gain.value = 0.16;
  vocalMaster.connect(destination);
  if (reverb) {
    const send = ctx.createGain();
    send.gain.value = 0.3;
    vocalMaster.connect(send);
    send.connect(reverb);
  }

  let t = startTime;
  for (let i = 0; i < noteCount; i++) {
    const interval = scale[Math.floor(rand() * scale.length)];
    const freq = midiToFreq(vocalRootMidi + interval);
    const dur = noteDur * (0.85 + rand() * 0.1);

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq * Math.pow(2, -1 / 12), t);
    osc.frequency.linearRampToValueAtTime(freq, t + 0.08); // slide up into the note, like a sung attack

    const vibrato = ctx.createOscillator();
    vibrato.type = "sine";
    vibrato.frequency.value = 5.5;
    const vibratoGain = ctx.createGain();
    vibratoGain.gain.value = freq * 0.02;
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);

    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0, t);
    noteGain.gain.linearRampToValueAtTime(1, t + 0.05);
    noteGain.gain.setValueAtTime(1, t + dur - 0.08);
    noteGain.gain.linearRampToValueAtTime(0, t + dur);

    formants.forEach((f) => {
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = f;
      bp.Q.value = 8;
      osc.connect(bp);
      bp.connect(noteGain);
    });
    noteGain.connect(vocalMaster);

    osc.start(t);
    osc.stop(t + dur + 0.05);
    vibrato.start(t);
    vibrato.stop(t + dur + 0.05);
    activeOscillators.push(osc, vibrato);

    t += dur;
  }

  return {
    stop: () => {
      const now = ctx.currentTime;
      for (const osc of activeOscillators) {
        try {
          osc.stop(now);
        } catch {
          // already stopped
        }
      }
    },
  };
}

export default function GuessTheSongGame() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [you, setYou] = useState<You | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [genreChoice, setGenreChoice] = useState<Genre>("rock");
  const [difficultyChoice, setDifficultyChoice] = useState<Difficulty>("normal");
  const [maxPlayersChoice, setMaxPlayersChoice] = useState(5);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [menuBusy, setMenuBusy] = useState(false);

  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const reverbRef = useRef<ConvolverNode | null>(null);
  const lastPlayedRoundRef = useRef<number | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const realClipRef = useRef<HTMLAudioElement | null>(null);
  const activeClipRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((data) => {
        if (data.session) {
          setYou({ accountId: data.session.accountId, gameName: data.session.gameName });
        }
      })
      .finally(() => setCheckingSession(false));
  }, []);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const convolver = ctx.createConvolver();
      convolver.buffer = makeReverbImpulse(ctx, 0.9);
      convolver.connect(ctx.destination);
      reverbRef.current = convolver;
    }
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  const playRiff = useCallback(
    (songId: number) => {
      const ctx = getAudioContext();
      const startTime = ctx.currentTime + 0.05;
      const buffer = renderRiffBuffer(ctx, songId);

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const overdrive = ctx.createWaveShaper();
      overdrive.curve = makeOverdriveCurve(30);
      overdrive.oversample = "4x";

      const toneFilter = ctx.createBiquadFilter();
      toneFilter.type = "lowpass";
      toneFilter.frequency.value = 3200;
      const bodyFilter = ctx.createBiquadFilter();
      bodyFilter.type = "highpass";
      bodyFilter.frequency.value = 90;

      const dryGain = ctx.createGain();
      dryGain.gain.value = 0.85;
      const wetGain = ctx.createGain();
      wetGain.gain.value = 0.18;
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.5;

      source.connect(overdrive);
      overdrive.connect(toneFilter);
      toneFilter.connect(bodyFilter);
      bodyFilter.connect(dryGain);
      bodyFilter.connect(wetGain);
      dryGain.connect(masterGain);
      masterGain.connect(ctx.destination);
      if (reverbRef.current) wetGain.connect(reverbRef.current);

      source.start(startTime);
      const vocal = playVocalLayer(ctx, songId, startTime, ctx.destination, reverbRef.current);
      return {
        stop: () => {
          try {
            source.stop(ctx.currentTime);
          } catch {
            // already stopped
          }
          vocal.stop();
        },
      };
    },
    [getAudioContext]
  );

  // Try the real recording first (iTunes' 30s preview clips — actual drums,
  // vocals, guitar), and only fall back to the synthesized riff if no preview
  // is available or playback is blocked. Whatever plays is capped at CLIP_MS
  // and can also be cut short immediately (guess submitted, round moved on).
  const playClip = useCallback(
    async (songId: number) => {
      activeClipRef.current?.stop();
      activeClipRef.current = null;

      let usedReal = false;
      try {
        const res = await fetch(`/api/preview?songId=${songId}`);
        const data = await res.json();
        if (data.previewUrl) {
          const audio = new Audio(data.previewUrl);
          audio.volume = 0.85;
          realClipRef.current = audio;
          await audio.play();
          usedReal = true;
          const controller = {
            stop: () => {
              audio.pause();
              if (realClipRef.current === audio) realClipRef.current = null;
            },
          };
          activeClipRef.current = controller;
          setTimeout(() => controller.stop(), CLIP_MS);
        }
      } catch {
        // fall through to the synth below
      }
      if (!usedReal) {
        activeClipRef.current = playRiff(songId);
      }
    },
    [playRiff]
  );

  const stopActiveClip = useCallback(() => {
    activeClipRef.current?.stop();
    activeClipRef.current = null;
  }, []);

  const fetchRoom = useCallback(async (code: string) => {
    const res = await fetch(`/api/rooms/${code}`);
    const data = await res.json();
    if (!res.ok) {
      setRoomError(data.error ?? "Something went wrong");
      return;
    }
    setRoomError(null);
    setRoom(data);
  }, []);

  useEffect(() => {
    if (!roomCode) return;
    let cancelled = false;
    const tick = async () => {
      await fetchRoom(roomCode);
      if (!cancelled) pollTimerRef.current = setTimeout(tick, POLL_MS);
    };
    tick();
    return () => {
      cancelled = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [roomCode, fetchRoom]);

  useEffect(() => {
    if (!room?.round) return;
    if (room.round.phase !== "clip") return;
    if (lastPlayedRoundRef.current === room.round.roundNumber) return;
    lastPlayedRoundRef.current = room.round.roundNumber;
    playClip(room.round.songId);
  }, [room, playClip]);

  // Cut the clip short the moment the round leaves the "clip" phase, whether
  // that's because everyone (including you) guessed, or the clip timed out.
  useEffect(() => {
    if (room?.round && room.round.phase !== "clip") stopActiveClip();
  }, [room, stopActiveClip]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthBusy(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameName: nameInput, pin: pinInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error ?? "Couldn't sign in");
        return;
      }
      setYou({ accountId: data.accountId, gameName: data.gameName });
    } finally {
      setAuthBusy(false);
    }
  };

  const createRoom = async () => {
    setMenuBusy(true);
    setMenuError(null);
    getAudioContext();
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genre: genreChoice,
          difficulty: difficultyChoice,
          maxPlayers: maxPlayersChoice,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMenuError(data.error ?? "Couldn't create a room");
        return;
      }
      setRoomCode(data.roomCode);
    } finally {
      setMenuBusy(false);
    }
  };

  const joinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) return;
    setMenuBusy(true);
    setMenuError(null);
    getAudioContext();
    try {
      const res = await fetch(`/api/rooms/${code}/join`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMenuError(data.error ?? "Couldn't join that room");
        return;
      }
      setRoomCode(data.roomCode);
    } finally {
      setMenuBusy(false);
    }
  };

  const startGame = async () => {
    if (!roomCode) return;
    setActionBusy(true);
    try {
      const res = await fetch(`/api/rooms/${roomCode}/start`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) setRoomError(data.error ?? "Couldn't start the game");
      else fetchRoom(roomCode);
    } finally {
      setActionBusy(false);
    }
  };

  const submitGuess = async (songId: number) => {
    if (!roomCode) return;
    stopActiveClip();
    setActionBusy(true);
    try {
      const res = await fetch(`/api/rooms/${roomCode}/guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId }),
      });
      const data = await res.json();
      if (!res.ok) setRoomError(data.error ?? "Couldn't submit your guess");
      else fetchRoom(roomCode);
    } finally {
      setActionBusy(false);
    }
  };

  const nextRound = async () => {
    if (!roomCode) return;
    setActionBusy(true);
    try {
      const res = await fetch(`/api/rooms/${roomCode}/next`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) setRoomError(data.error ?? "Couldn't advance the round");
      else fetchRoom(roomCode);
    } finally {
      setActionBusy(false);
    }
  };

  const leaveToMenu = () => {
    stopActiveClip();
    setRoomCode(null);
    setRoom(null);
    setRoomError(null);
    lastPlayedRoundRef.current = null;
  };

  const switchPlayer = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    setYou(null);
    leaveToMenu();
  };

  const copyCode = () => {
    if (roomCode) navigator.clipboard?.writeText(roomCode);
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-black text-white font-sans px-4 py-10 gap-6">
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center">
        🎤 Guess the Rock Song
      </h1>
      <Link href="/game" className="text-sm text-zinc-400 hover:text-white -mt-4">
        ⬅ Back to Rhythm Game
      </Link>

      {checkingSession && <p className="text-zinc-400">Loading...</p>}

      {!checkingSession && !you && (
        <form
          onSubmit={handleAuth}
          className="w-full max-w-sm bg-zinc-900 border-2 border-zinc-700 rounded-lg p-6 flex flex-col gap-3"
        >
          <p className="text-zinc-400 text-sm text-center">
            Pick a name and a PIN. Use the same ones next time to keep your
            identity if you get disconnected.
          </p>
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Your name"
            maxLength={20}
            className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 font-mono"
          />
          <input
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
            placeholder="4-6 digit PIN"
            inputMode="numeric"
            maxLength={6}
            className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 font-mono"
          />
          {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
          <button
            type="submit"
            disabled={authBusy}
            className="rounded-full bg-white text-black px-6 py-3 font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {authBusy ? "..." : "Continue"}
          </button>
        </form>
      )}

      {!checkingSession && you && !roomCode && (
        <div className="w-full max-w-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-zinc-400">
              Playing as <span className="text-white font-semibold">{you.gameName}</span>
            </p>
            <button onClick={switchPlayer} className="text-xs text-zinc-500 hover:text-white underline">
              switch player
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 bg-zinc-900 border-2 border-zinc-700 rounded-lg p-6 flex flex-col gap-3 items-center text-center">
              <p className="text-lg font-bold">🎸 Start a Room</p>
              <p className="text-zinc-400 text-sm">
                Create a room and share the code with friends.
              </p>

              <div className="w-full flex flex-col gap-1 items-center">
                <p className="text-xs text-zinc-500 uppercase tracking-wide">
                  Players (1 = just you)
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {PLAYER_COUNTS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setMaxPlayersChoice(n)}
                      className={`w-8 h-8 rounded-full text-xs font-semibold transition-colors ${
                        maxPlayersChoice === n
                          ? "bg-white text-black"
                          : "border border-zinc-600 text-zinc-400 hover:bg-zinc-800"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full flex flex-col gap-1 items-center">
                <p className="text-xs text-zinc-500 uppercase tracking-wide">Genre</p>
                <div className="flex gap-1.5">
                  {GENRES.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGenreChoice(g)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                        genreChoice === g
                          ? "bg-white text-black"
                          : "border border-zinc-600 text-zinc-400 hover:bg-zinc-800"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full flex flex-col gap-1 items-center">
                <p className="text-xs text-zinc-500 uppercase tracking-wide">Difficulty</p>
                <div className="flex gap-1.5">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficultyChoice(d)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                        difficultyChoice === d
                          ? "bg-white text-black"
                          : "border border-zinc-600 text-zinc-400 hover:bg-zinc-800"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={createRoom}
                disabled={menuBusy}
                className="mt-auto w-full rounded-full bg-white text-black px-6 py-3 font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                Create a Room
              </button>
            </div>

            <div className="flex-1 bg-zinc-900 border-2 border-zinc-700 rounded-lg p-6 flex flex-col gap-3 items-center text-center">
              <p className="text-lg font-bold">🔗 Join a Room</p>
              <p className="text-zinc-400 text-sm">Got a code from a friend? Enter it here.</p>
              <form onSubmit={joinRoom} className="mt-auto w-full flex gap-2">
                <input
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="ROOM CODE"
                  maxLength={5}
                  className="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 font-mono tracking-widest text-center"
                />
                <button
                  type="submit"
                  disabled={menuBusy}
                  className="rounded-full bg-white text-black px-6 py-3 font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  Join
                </button>
              </form>
            </div>
          </div>
          {menuError && <p className="text-red-400 text-sm text-center">{menuError}</p>}
        </div>
      )}

      {roomCode && !room && !roomError && <p className="text-zinc-400">Loading room...</p>}

      {roomCode && roomError && (
        <div className="w-full max-w-sm bg-zinc-900 border-2 border-zinc-700 rounded-lg p-6 flex flex-col gap-3 items-center">
          <p className="text-red-400 text-sm text-center">{roomError}</p>
          <button
            onClick={leaveToMenu}
            className="rounded-full border border-zinc-600 px-5 py-2 font-semibold hover:bg-zinc-800 transition-colors"
          >
            Back to Menu
          </button>
        </div>
      )}

      {room && room.status === "lobby" && (
        <div className="w-full max-w-sm bg-zinc-900 border-2 border-zinc-700 rounded-lg p-6 flex flex-col gap-4 items-center">
          <p className="text-zinc-400 text-sm">Room code — share this with your friends</p>
          <button
            onClick={copyCode}
            className="text-4xl font-mono font-extrabold tracking-[0.3em] bg-zinc-800 border border-zinc-700 rounded-lg px-6 py-3 hover:bg-zinc-700 transition-colors"
            title="Copy code"
          >
            {room.code}
          </button>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="text-xs uppercase tracking-wide text-zinc-500 bg-zinc-800 rounded-full px-3 py-1">
              Genre: {room.genre}
            </span>
            <span className="text-xs uppercase tracking-wide text-zinc-500 bg-zinc-800 rounded-full px-3 py-1">
              Difficulty: {room.difficulty}
            </span>
            <span className="text-xs uppercase tracking-wide text-zinc-500 bg-zinc-800 rounded-full px-3 py-1">
              Players: {room.players.length} / {room.maxPlayers}
            </span>
          </div>
          <div className="w-full flex flex-col gap-2">
            {room.players.map((p) => (
              <div
                key={p.accountId}
                className="flex items-center justify-between bg-zinc-800 rounded px-4 py-2"
              >
                <span>{p.gameName}</span>
                {p.accountId === room.hostAccountId && (
                  <span className="text-xs text-zinc-500">HOST</span>
                )}
              </div>
            ))}
          </div>
          {room.you.isHost ? (
            <button
              onClick={startGame}
              disabled={actionBusy}
              className="rounded-full bg-white text-black px-6 py-3 font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-40"
            >
              {room.players.length < 2 ? "Start Solo" : "Start Game"}
            </button>
          ) : (
            <p className="text-zinc-400 text-sm">Waiting for the host to start...</p>
          )}
        </div>
      )}

      {room && room.status === "active" && room.round && (
        <div className="w-full max-w-md bg-zinc-900 border-2 border-zinc-700 rounded-lg p-6 flex flex-col gap-5">
          <p className="text-center text-sm text-zinc-400 font-mono">
            Round {room.round.roundNumber} / {room.totalRounds}
          </p>

          <div className="flex gap-2 overflow-x-auto -mx-1 px-1">
            {[...room.players]
              .sort((a, b) => b.score - a.score)
              .map((p, i) => (
                <div
                  key={p.accountId}
                  className="flex items-center gap-1.5 shrink-0 bg-zinc-800 rounded-full px-3 py-1 text-xs font-mono"
                >
                  <span className="text-zinc-500">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <span className="truncate max-w-[7rem]">{p.gameName}</span>
                  <span className="text-zinc-400">{p.score}</span>
                </div>
              ))}
          </div>

          {(room.round.phase === "clip" || room.round.phase === "guessing") && (
            <>
              {room.round.phase === "clip" && (
                <p className="text-center text-zinc-400 text-sm -mb-2">
                  🎸 Still playing... but you can answer anytime, no need to wait
                </p>
              )}
              {room.round.yourGuessSongId == null ? (
                <>
                  <p className="text-center font-semibold text-lg">What&apos;s that song?</p>
                  <div className="grid grid-cols-1 gap-2">
                    {room.round.options.map((song) => (
                      <button
                        key={song.id}
                        onClick={() => submitGuess(song.id)}
                        disabled={actionBusy}
                        className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-4 py-3 text-left transition-colors disabled:opacity-50"
                      >
                        <span className="font-semibold">{song.title}</span>{" "}
                        <span className="text-zinc-400">— {song.artist}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-center text-zinc-400">
                  Guess locked in — waiting for{" "}
                  {room.players.length - room.round.guesses.length} more player
                  {room.players.length - room.round.guesses.length === 1 ? "" : "s"}...
                </p>
              )}
            </>
          )}

          {room.round.phase === "reveal" && (
            <>
              <p className="text-center">
                🎸 It was{" "}
                <span className="font-semibold">
                  {room.round.options.find((s) => s.id === room.round!.songId)?.title}
                </span>{" "}
                by {room.round.options.find((s) => s.id === room.round!.songId)?.artist}
              </p>
              <div className="flex flex-col gap-2">
                {room.players.map((p) => {
                  const g = room.round!.guesses.find((gu) => gu.roomPlayerId === p.id);
                  const guessedSong = room.round!.options.find((s) => s.id === g?.songId);
                  return (
                    <div
                      key={p.accountId}
                      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 bg-zinc-800 rounded px-4 py-2"
                    >
                      <span className="min-w-0 truncate">{p.gameName}</span>
                      <span
                        className={
                          g?.isCorrect
                            ? "text-green-400 text-sm min-w-0 truncate"
                            : "text-red-400 text-sm min-w-0 truncate"
                        }
                      >
                        {g ? (g.isCorrect ? "✅" : "❌") : "—"} {guessedSong?.title ?? "no guess"}
                      </span>
                      <span className="font-mono text-sm">{p.score} pts</span>
                    </div>
                  );
                })}
              </div>
              {room.you.isHost ? (
                <button
                  onClick={nextRound}
                  disabled={actionBusy}
                  className="rounded-full bg-white text-black px-6 py-3 font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  {room.currentRoundNumber >= room.totalRounds ? "See Final Results" : "Next Song"}
                </button>
              ) : (
                <p className="text-center text-zinc-400 text-sm">Waiting for the host...</p>
              )}
            </>
          )}
        </div>
      )}

      {room && room.status === "finished" && (
        <div className="w-full max-w-md bg-zinc-900 border-2 border-zinc-700 rounded-lg p-6 flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-center">🏆 Final Results</h2>
          <div className="flex flex-col gap-2">
            {[...room.players]
              .sort((a, b) => b.score - a.score)
              .map((p, i) => (
                <div
                  key={p.accountId}
                  className="flex items-center justify-between bg-zinc-800 rounded px-4 py-3"
                >
                  <span className="font-mono text-lg">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <span className="flex-1 px-3 truncate">{p.gameName}</span>
                  <span className="font-mono">{p.score} pts</span>
                </div>
              ))}
          </div>
          <button
            onClick={leaveToMenu}
            className="rounded-full bg-white text-black px-6 py-3 font-semibold hover:bg-zinc-200 transition-colors"
          >
            Back to Menu
          </button>
        </div>
      )}
    </div>
  );
}
