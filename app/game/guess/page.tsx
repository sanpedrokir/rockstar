"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Song = { id: number; title: string; artist: string };

const SONGS: Song[] = [
  { id: 1, title: "Holiday", artist: "Scorpions" },
  { id: 2, title: "Rock You Like a Hurricane", artist: "Scorpions" },
  { id: 3, title: "Wind of Change", artist: "Scorpions" },
  { id: 4, title: "Still Loving You", artist: "Scorpions" },
  { id: 5, title: "No One Like You", artist: "Scorpions" },

  { id: 6, title: "Paranoid", artist: "Black Sabbath" },
  { id: 7, title: "Iron Man", artist: "Black Sabbath" },
  { id: 8, title: "War Pigs", artist: "Black Sabbath" },
  { id: 9, title: "Sweet Leaf", artist: "Black Sabbath" },

  { id: 10, title: "Sweet Child O' Mine", artist: "Guns N' Roses" },
  { id: 11, title: "Welcome to the Jungle", artist: "Guns N' Roses" },
  { id: 12, title: "Paradise City", artist: "Guns N' Roses" },
  { id: 13, title: "November Rain", artist: "Guns N' Roses" },
  { id: 14, title: "Patience", artist: "Guns N' Roses" },

  { id: 15, title: "Since You Been Gone", artist: "Rainbow" },
  { id: 16, title: "Man on the Silver Mountain", artist: "Rainbow" },
  { id: 17, title: "Stargazer", artist: "Rainbow" },
  { id: 18, title: "Long Live Rock 'n' Roll", artist: "Rainbow" },

  { id: 19, title: "Back in Black", artist: "AC/DC" },
  { id: 20, title: "Highway to Hell", artist: "AC/DC" },
  { id: 21, title: "Thunderstruck", artist: "AC/DC" },
  { id: 22, title: "You Shook Me All Night Long", artist: "AC/DC" },
  { id: 23, title: "T.N.T.", artist: "AC/DC" },

  { id: 24, title: "The Number of the Beast", artist: "Iron Maiden" },
  { id: 25, title: "Run to the Hills", artist: "Iron Maiden" },
  { id: 26, title: "Fear of the Dark", artist: "Iron Maiden" },
  { id: 27, title: "The Trooper", artist: "Iron Maiden" },
  { id: 28, title: "Aces High", artist: "Iron Maiden" },

  { id: 29, title: "Enter Sandman", artist: "Metallica" },
  { id: 30, title: "Master of Puppets", artist: "Metallica" },
  { id: 31, title: "Nothing Else Matters", artist: "Metallica" },
  { id: 32, title: "One", artist: "Metallica" },
  { id: 33, title: "For Whom the Bell Tolls", artist: "Metallica" },

  { id: 34, title: "Pour Some Sugar on Me", artist: "Def Leppard" },
  { id: 35, title: "Photograph", artist: "Def Leppard" },
  { id: 36, title: "Rock of Ages", artist: "Def Leppard" },
  { id: 37, title: "Hysteria", artist: "Def Leppard" },

  { id: 38, title: "Kickstart My Heart", artist: "Mötley Crüe" },
  { id: 39, title: "Dr. Feelgood", artist: "Mötley Crüe" },
  { id: 40, title: "Girls, Girls, Girls", artist: "Mötley Crüe" },
  { id: 41, title: "Home Sweet Home", artist: "Mötley Crüe" },

  { id: 42, title: "18 and Life", artist: "Skid Row" },
  { id: 43, title: "I Remember You", artist: "Skid Row" },
  { id: 44, title: "Youth Gone Wild", artist: "Skid Row" },

  { id: 45, title: "Feel Like Makin' Love", artist: "Bad Company" },
  { id: 46, title: "Can't Get Enough", artist: "Bad Company" },

  { id: 47, title: "Another Brick in the Wall", artist: "Pink Floyd" },
  { id: 48, title: "Comfortably Numb", artist: "Pink Floyd" },
  { id: 49, title: "Wish You Were Here", artist: "Pink Floyd" },
  { id: 50, title: "Money", artist: "Pink Floyd" },
  { id: 51, title: "Time", artist: "Pink Floyd" },

  { id: 52, title: "Hotel California", artist: "Eagles" },
  { id: 53, title: "Take It Easy", artist: "Eagles" },
  { id: 54, title: "Life in the Fast Lane", artist: "Eagles" },
  { id: 55, title: "Desperado", artist: "Eagles" },

  { id: 56, title: "Bohemian Rhapsody", artist: "Queen" },
  { id: 57, title: "We Will Rock You", artist: "Queen" },
  { id: 58, title: "Don't Stop Me Now", artist: "Queen" },

  { id: 59, title: "Smells Like Teen Spirit", artist: "Nirvana" },
  { id: 60, title: "Come as You Are", artist: "Nirvana" },

  { id: 61, title: "Stairway to Heaven", artist: "Led Zeppelin" },
  { id: 62, title: "Whole Lotta Love", artist: "Led Zeppelin" },
  { id: 63, title: "Kashmir", artist: "Led Zeppelin" },

  { id: 64, title: "Paint It Black", artist: "The Rolling Stones" },
  { id: 65, title: "Sympathy for the Devil", artist: "The Rolling Stones" },

  { id: 66, title: "Smoke on the Water", artist: "Deep Purple" },
  { id: 67, title: "Highway Star", artist: "Deep Purple" },

  { id: 68, title: "Livin' on a Prayer", artist: "Bon Jovi" },
  { id: 69, title: "Wanted Dead or Alive", artist: "Bon Jovi" },

  { id: 70, title: "Don't Stop Believin'", artist: "Journey" },

  { id: 71, title: "Dream On", artist: "Aerosmith" },
  { id: 72, title: "Walk This Way", artist: "Aerosmith" },

  { id: 73, title: "Jump", artist: "Van Halen" },
  { id: 74, title: "Panama", artist: "Van Halen" },

  { id: 75, title: "Baba O'Riley", artist: "The Who" },
  { id: 76, title: "Dreams", artist: "Fleetwood Mac" },
  { id: 77, title: "With or Without You", artist: "U2" },
  { id: 78, title: "The Final Countdown", artist: "Europe" },

  { id: 79, title: "Here I Go Again", artist: "Whitesnake" },
  { id: 80, title: "Breaking the Law", artist: "Judas Priest" },
  { id: 81, title: "Rock and Roll All Nite", artist: "Kiss" },
  { id: 82, title: "Crazy Train", artist: "Ozzy Osbourne" },
  { id: 83, title: "Rainbow in the Dark", artist: "Dio" },
  { id: 84, title: "Sharp Dressed Man", artist: "ZZ Top" },
  { id: 85, title: "More Than a Feeling", artist: "Boston" },
  { id: 86, title: "Tom Sawyer", artist: "Rush" },
  { id: 87, title: "School's Out", artist: "Alice Cooper" },
  { id: 88, title: "We're Not Gonna Take It", artist: "Twisted Sister" },
  { id: 89, title: "Every Rose Has Its Thorn", artist: "Poison" },
];

const TOTAL_ROUNDS = 8;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6;
const CLIP_MS = 1800;

type Phase = "setup" | "clip" | "guessing" | "reveal" | "finished";
type Guess = { playerIndex: number; songId: number };

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function GuessTheSongGame() {
  const [players, setPlayers] = useState<string[]>([
    "Player 1",
    "Player 2",
    "Player 3",
  ]);
  const [scores, setScores] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>("setup");
  const [round, setRound] = useState(0);
  const [usedSongIds, setUsedSongIds] = useState<number[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [options, setOptions] = useState<Song[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [guesses, setGuesses] = useState<Guess[]>([]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const clipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const guessesRef = useRef<Guess[]>([]);
  useEffect(() => {
    guessesRef.current = guesses;
  }, [guesses]);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playRiff = useCallback(() => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const rootMidi = 40 + Math.floor(Math.random() * 12);
    const intervals = [0, 3, 5, 7, 10];
    intervals.forEach((interval, i) => {
      const freq = 440 * Math.pow(2, (rootMidi + interval - 69) / 12);
      const start = now + i * 0.22;
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = freq;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1500;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.22);
    });
  }, [getAudioContext]);

  const pickRound = useCallback((prevUsed: number[]) => {
    const available = SONGS.filter((s) => !prevUsed.includes(s.id));
    const pool = available.length > 0 ? available : SONGS;
    const song = pool[Math.floor(Math.random() * pool.length)];
    const distractors = shuffle(SONGS.filter((s) => s.id !== song.id)).slice(0, 3);
    setCurrentSong(song);
    setOptions(shuffle([song, ...distractors]));
    setTurnIndex(0);
    setGuesses([]);
    setUsedSongIds([...prevUsed, song.id]);
    setPhase("clip");
  }, []);

  const startGame = useCallback(() => {
    getAudioContext();
    setScores(players.map(() => 0));
    setRound(1);
    pickRound([]);
  }, [players, pickRound, getAudioContext]);

  useEffect(() => {
    if (phase !== "clip") return;
    playRiff();
    clipTimeoutRef.current = setTimeout(() => setPhase("guessing"), CLIP_MS);
    return () => {
      if (clipTimeoutRef.current) clearTimeout(clipTimeoutRef.current);
    };
  }, [phase, playRiff]);

  const skipClip = useCallback(() => {
    if (clipTimeoutRef.current) clearTimeout(clipTimeoutRef.current);
    setPhase("guessing");
  }, []);

  const handleGuess = useCallback(
    (songId: number) => {
      const newGuess: Guess = { playerIndex: turnIndex, songId };
      const updatedGuesses = [...guessesRef.current, newGuess];
      setGuesses(updatedGuesses);
      if (turnIndex + 1 < players.length) {
        setTurnIndex((t) => t + 1);
      } else {
        setScores((prev) => {
          const next = [...prev];
          for (const g of updatedGuesses) {
            if (currentSong && g.songId === currentSong.id) next[g.playerIndex] += 1;
          }
          return next;
        });
        setPhase("reveal");
      }
    },
    [turnIndex, players.length, currentSong]
  );

  const nextRound = useCallback(() => {
    if (round >= TOTAL_ROUNDS) {
      setPhase("finished");
    } else {
      setRound((r) => r + 1);
      pickRound(usedSongIds);
    }
  }, [round, usedSongIds, pickRound]);

  const addPlayer = () =>
    setPlayers((p) =>
      p.length < MAX_PLAYERS ? [...p, `Player ${p.length + 1}`] : p
    );
  const removePlayer = () =>
    setPlayers((p) => (p.length > MIN_PLAYERS ? p.slice(0, -1) : p));
  const renamePlayer = (i: number, name: string) =>
    setPlayers((p) => p.map((n, idx) => (idx === i ? name : n)));

  const playAgain = () => {
    setPhase("setup");
    setScores([]);
    setRound(0);
    setUsedSongIds([]);
    setCurrentSong(null);
    setOptions([]);
    setGuesses([]);
  };

  const standings = useMemo(() => {
    return players
      .map((name, i) => ({ name, score: scores[i] ?? 0 }))
      .sort((a, b) => b.score - a.score)
      .map((entry, _i, arr) => ({
        ...entry,
        rank: 1 + arr.filter((e) => e.score > entry.score).length,
      }));
  }, [players, scores]);

  const medal = (rank: number) =>
    rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-black text-white font-sans px-4 py-10 gap-6">
      <div className="flex items-center gap-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-center">
          🎤 Guess the Rock Song
        </h1>
      </div>
      <Link href="/game" className="text-sm text-zinc-400 hover:text-white -mt-4">
        ⬅ Back to Rhythm Game
      </Link>

      {phase === "setup" && (
        <div className="w-full max-w-md bg-zinc-900 border-2 border-zinc-700 rounded-lg p-6 flex flex-col gap-4">
          <p className="text-zinc-400 text-sm text-center">
            A short mystery riff plays, then everyone takes a turn guessing the
            song. Most correct guesses wins!
          </p>
          <div className="flex flex-col gap-2">
            {players.map((name, i) => (
              <input
                key={i}
                value={name}
                onChange={(e) => renamePlayer(i, e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 font-mono"
              />
            ))}
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={removePlayer}
              disabled={players.length <= MIN_PLAYERS}
              className="w-9 h-9 rounded-full bg-zinc-700 disabled:opacity-30 font-bold"
            >
              −
            </button>
            <span className="text-sm text-zinc-400">{players.length} players</span>
            <button
              onClick={addPlayer}
              disabled={players.length >= MAX_PLAYERS}
              className="w-9 h-9 rounded-full bg-zinc-700 disabled:opacity-30 font-bold"
            >
              +
            </button>
          </div>
          <button
            onClick={startGame}
            className="rounded-full bg-white text-black px-6 py-3 font-semibold hover:bg-zinc-200 transition-colors"
          >
            Start Game
          </button>
        </div>
      )}

      {phase !== "setup" && phase !== "finished" && (
        <div className="w-full max-w-md bg-zinc-900 border-2 border-zinc-700 rounded-lg p-6 flex flex-col gap-5">
          <p className="text-center text-sm text-zinc-400 font-mono">
            Round {round} / {TOTAL_ROUNDS}
          </p>

          {phase === "clip" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <span className="text-5xl animate-bounce">🎵</span>
              <p className="text-zinc-300">Listen closely...</p>
              <button
                onClick={skipClip}
                className="text-sm text-zinc-400 hover:text-white underline"
              >
                Skip ▶
              </button>
            </div>
          )}

          {phase === "guessing" && (
            <>
              <p className="text-center font-semibold text-lg">
                {players[turnIndex]}&apos;s turn — what&apos;s that song?
              </p>
              <p className="text-center text-xs text-zinc-500">
                Guess {turnIndex + 1} of {players.length}
              </p>
              <div className="grid grid-cols-1 gap-2">
                {options.map((song) => (
                  <button
                    key={song.id}
                    onClick={() => handleGuess(song.id)}
                    className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-4 py-3 text-left transition-colors"
                  >
                    <span className="font-semibold">{song.title}</span>{" "}
                    <span className="text-zinc-400">— {song.artist}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {phase === "reveal" && currentSong && (
            <>
              <p className="text-center">
                🎸 It was{" "}
                <span className="font-semibold">{currentSong.title}</span> by{" "}
                {currentSong.artist}
              </p>
              <div className="flex flex-col gap-2">
                {players.map((name, i) => {
                  const g = guesses.find((gu) => gu.playerIndex === i);
                  const guessedSong = SONGS.find((s) => s.id === g?.songId);
                  const correct = g?.songId === currentSong.id;
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 bg-zinc-800 rounded px-4 py-2"
                    >
                      <span>{name}</span>
                      <span
                        className={
                          correct ? "text-green-400 text-sm" : "text-red-400 text-sm"
                        }
                      >
                        {correct ? "✅" : "❌"} {guessedSong?.title ?? "—"}
                      </span>
                      <span className="font-mono text-sm">
                        {scores[i] ?? 0} pts
                      </span>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={nextRound}
                className="rounded-full bg-white text-black px-6 py-3 font-semibold hover:bg-zinc-200 transition-colors"
              >
                {round >= TOTAL_ROUNDS ? "See Final Results" : "Next Round"}
              </button>
            </>
          )}
        </div>
      )}

      {phase === "finished" && (
        <div className="w-full max-w-md bg-zinc-900 border-2 border-zinc-700 rounded-lg p-6 flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-center">🏆 Final Results</h2>
          <div className="flex flex-col gap-2">
            {standings.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-zinc-800 rounded px-4 py-3"
              >
                <span className="font-mono text-lg">{medal(s.rank)}</span>
                <span className="flex-1 px-3">{s.name}</span>
                <span className="font-mono">{s.score} pts</span>
              </div>
            ))}
          </div>
          <button
            onClick={playAgain}
            className="rounded-full bg-white text-black px-6 py-3 font-semibold hover:bg-zinc-200 transition-colors"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
