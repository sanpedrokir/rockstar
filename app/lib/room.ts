import "server-only";
import { customAlphabet } from "nanoid";
import { SONGS, shuffle, type Difficulty, type Genre } from "@/app/lib/songs";

export const CLIP_MS = 10000;
export const GUESS_WINDOW_MS = 20000;
export const TOTAL_ROUNDS = 8;
export const MIN_PLAYERS = 1;
export const MAX_PLAYERS = 5;

const generateCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 5);
export function generateRoomCode() {
  return generateCode();
}

export function pickRound(
  excludeSongIds: number[],
  difficulty: Difficulty = "normal",
  genre: Genre = "rock"
) {
  const genreSongs = SONGS.filter((s) => s.genre === genre);
  const genrePool = genreSongs.length > 0 ? genreSongs : SONGS;
  const tierSongs = genrePool.filter((s) => s.difficulty === difficulty);
  const tier = tierSongs.length > 0 ? tierSongs : genrePool;
  const available = tier.filter((s) => !excludeSongIds.includes(s.id));
  const pool = available.length > 0 ? available : tier;
  const song = pool[Math.floor(Math.random() * pool.length)];

  // Draw wrong options from the same genre+difficulty tier too, so "hard"
  // rounds don't give the answer away via three obviously-famous decoys, and
  // alternative rounds don't leak rock titles as options (or vice versa).
  const distractorPool = tier.filter((s) => s.id !== song.id);
  const distractorSource = distractorPool.length >= 3 ? distractorPool : genrePool.filter((s) => s.id !== song.id);
  const distractors = shuffle(distractorSource).slice(0, 3);
  const options = shuffle([song, ...distractors]);
  return { songId: song.id, optionIds: options.map((s) => s.id) };
}

export type RoundPhase = "clip" | "guessing" | "reveal";

export function computeRoundPhase(
  startedAt: Date,
  guessCount: number,
  playerCount: number
): { phase: RoundPhase; revealed: boolean; guessingStartsAt: number; revealAt: number } {
  const startedAtMs = startedAt.getTime();
  const guessingStartsAt = startedAtMs + CLIP_MS;
  const deadline = guessingStartsAt + GUESS_WINDOW_MS;
  const now = Date.now();
  const allGuessed = playerCount > 0 && guessCount >= playerCount;
  const revealed = allGuessed || now >= deadline;

  if (revealed) {
    return { phase: "reveal", revealed: true, guessingStartsAt, revealAt: allGuessed ? now : deadline };
  }
  if (now >= guessingStartsAt) {
    return { phase: "guessing", revealed: false, guessingStartsAt, revealAt: deadline };
  }
  return { phase: "clip", revealed: false, guessingStartsAt, revealAt: deadline };
}
