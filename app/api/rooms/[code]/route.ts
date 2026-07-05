import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSession } from "@/app/lib/session";
import { computeRoundPhase } from "@/app/lib/room";
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
