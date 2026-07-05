import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/lib/prisma";

export const BOT_NAME_PREFIX = "CPU ";

export function isBotName(gameName: string) {
  return gameName.toUpperCase().startsWith(BOT_NAME_PREFIX);
}

// Bots never log in, so the hash just has to exist to satisfy the schema.
// Computed once per server instance and reused for every bot account.
let dummyHash: Promise<string> | null = null;
function getDummyHash() {
  if (!dummyHash) dummyHash = bcrypt.hash(Math.random().toString(36), 10);
  return dummyHash;
}

// Bot accounts are shared, reusable "players" (CPU 1, CPU 2, ...) rather than
// one-off per room -- a RoomPlayer row is scoped to a single room, so the same
// bot account can sit in many different rooms at once without collisions.
export async function ensureBotAccountIds(count: number): Promise<number[]> {
  const hash = await getDummyHash();
  const ids: number[] = [];
  for (let i = 1; i <= count; i++) {
    const gameName = `${BOT_NAME_PREFIX}${i}`;
    const account = await prisma.account.upsert({
      where: { gameName },
      update: {},
      create: { gameName, pinHash: hash },
    });
    ids.push(account.id);
  }
  return ids;
}

// A bot "guesses" by picking one of the round's options -- correct slightly
// more often than a coin flip so bots feel like an opponent, not a wall.
export function botGuess(songId: number, optionIds: number[]): { guessedSongId: number; isCorrect: boolean } {
  if (Math.random() < 0.55) {
    return { guessedSongId: songId, isCorrect: true };
  }
  const wrongOptions = optionIds.filter((id) => id !== songId);
  const guessedSongId = wrongOptions[Math.floor(Math.random() * wrongOptions.length)] ?? songId;
  return { guessedSongId, isCorrect: guessedSongId === songId };
}
