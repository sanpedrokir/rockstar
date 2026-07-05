import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSession } from "@/app/lib/session";
import { CLIP_MS, computeRoundPhase } from "@/app/lib/room";
import { isBotName, botGuess } from "@/app/lib/bots";
import { SONGS, type Song } from "@/app/lib/songs";

function songLookup(id: number): Song | null {
  return SONGS.find((s) => s.id === id) ?? null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { code } = await params;
  const room = await prisma.gameRoom.findUnique({
    where: { roomCode: code.toUpperCase() },
    include: {
      players: { include: { account: true }, orderBy: { joinedAt: "asc" } },
      rounds: { orderBy: { roundNumber: "desc" }, take: 1, include: { guesses: true } },
    },
  });
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const membership = room.players.find((p) => p.accountId === session.accountId);
  if (!membership) {
    return NextResponse.json({ error: "Not a member of this room" }, { status: 403 });
  }

  // Bots don't poll, so simulate their guess lazily: the first real player to
  // poll after the clip has finished playing triggers it on their behalf.
  const currentRoundForBots = room.rounds[0];
  if (room.status === "active" && currentRoundForBots) {
    const pastClip = Date.now() >= currentRoundForBots.startedAt.getTime() + CLIP_MS;
    if (pastClip) {
      const missingBots = room.players.filter(
        (p) =>
          isBotName(p.account.gameName) &&
          !currentRoundForBots.guesses.some((g) => g.roomPlayerId === p.id)
      );
      for (const bot of missingBots) {
        const { guessedSongId, isCorrect } = botGuess(
          currentRoundForBots.songId,
          currentRoundForBots.optionIds
        );
        try {
          const guess = await prisma.guess.create({
            data: { roundId: currentRoundForBots.id, roomPlayerId: bot.id, guessedSongId, isCorrect },
          });
          currentRoundForBots.guesses.push(guess);
        } catch (err: unknown) {
          // Another concurrent poll (a different player) already inserted
          // this bot's guess for the round -- nothing left to do here.
          if ((err as { code?: string })?.code !== "P2002") throw err;
        }
      }
    }
  }

  const allGuesses = await prisma.guess.findMany({
    where: { round: { roomId: room.id } },
    select: { roomPlayerId: true, isCorrect: true },
  });
  const scoreByPlayer = new Map<number, number>();
  for (const g of allGuesses) {
    if (g.isCorrect) {
      scoreByPlayer.set(g.roomPlayerId, (scoreByPlayer.get(g.roomPlayerId) ?? 0) + 1);
    }
  }

  const currentRound = room.rounds[0] ?? null;
  let roundPayload = null;
  if (currentRound) {
    const { phase, revealed, revealAt } = computeRoundPhase(
      currentRound.startedAt,
      currentRound.guesses.length,
      room.players.length
    );
    const yourGuess = currentRound.guesses.find((g) => g.roomPlayerId === membership.id);
    roundPayload = {
      roundNumber: currentRound.roundNumber,
      // the riff is synthesized client-side from this id, so it has to travel
      // with the round from the start (there's no separately streamed audio to
      // keep secret) -- only *other players' guesses* stay hidden pre-reveal.
      songId: currentRound.songId,
      options: currentRound.optionIds.map(songLookup).filter((s): s is Song => s !== null),
      startedAt: currentRound.startedAt.toISOString(),
      phase,
      revealAt: new Date(revealAt).toISOString(),
      yourGuessSongId: yourGuess?.guessedSongId ?? null,
      revealed,
      guesses: currentRound.guesses.map((g) => ({
        roomPlayerId: g.roomPlayerId,
        songId: revealed ? g.guessedSongId : undefined,
        isCorrect: revealed ? g.isCorrect : undefined,
      })),
    };
  }

  return NextResponse.json({
    code: room.roomCode,
    status: room.status,
    difficulty: room.difficulty,
    genre: room.genre,
    maxPlayers: room.maxPlayers,
    totalRounds: room.totalRounds,
    currentRoundNumber: room.currentRound,
    hostAccountId: room.hostId,
    you: {
      accountId: session.accountId,
      gameName: session.gameName,
      isHost: room.hostId === session.accountId,
    },
    players: room.players.map((p) => ({
      id: p.id,
      accountId: p.accountId,
      gameName: p.account.gameName,
      score: scoreByPlayer.get(p.id) ?? 0,
    })),
    round: roundPayload,
  });
}
