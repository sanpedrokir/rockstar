import "server-only";
import { customAlphabet } from "nanoid";
import { SONGS, shuffle } from "@/app/lib/songs";

export const CLIP_MS = 10000;
export const GUESS_WINDOW_MS = 20000;
export const TOTAL_ROUNDS = 8;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;

const generateCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 5);
export function generateRoomCode() {
  return generateCode();
}

export function pickRound(excludeSongIds: number[]) {
  const available = SONGS.filter((s) => !excludeSongIds.includes(s.id));
  const pool = available.length > 0 ? available : SONGS;
  const song = pool[Math.floor(Math.random() * pool.length)];
  const distractors = shuffle(SONGS.filter((s) => s.id !== song.id)).slice(0, 3);
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
