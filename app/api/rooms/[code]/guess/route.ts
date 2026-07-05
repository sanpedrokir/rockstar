import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSession } from "@/app/lib/session";
import { computeRoundPhase } from "@/app/lib/room";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const songId = Number(body?.songId);
  if (!Number.isInteger(songId)) {
    return NextResponse.json({ error: "Invalid songId" }, { status: 400 });
  }

  const { code } = await params;
  const room = await prisma.gameRoom.findUnique({
    where: { roomCode: code.toUpperCase() },
    include: {
      players: true,
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

  const round = room.rounds[0];
  if (!round || room.status !== "active") {
    return NextResponse.json({ error: "No active round" }, { status: 409 });
  }

  // players can answer as soon as the round starts (no need to wait out the
  // full clip) -- the only cutoff is once the round has been revealed.
  const { revealed } = computeRoundPhase(round.startedAt, round.guesses.length, room.players.length);
  if (revealed) {
    return NextResponse.json({ error: "This round has already been revealed" }, { status: 409 });
  }
  if (!round.optionIds.includes(songId)) {
    return NextResponse.json({ error: "That song isn't one of the options" }, { status: 400 });
  }
  if (round.guesses.some((g) => g.roomPlayerId === membership.id)) {
    return NextResponse.json({ error: "Already guessed this round" }, { status: 409 });
  }

  await prisma.guess.create({
    data: {
      roundId: round.id,
      roomPlayerId: membership.id,
      guessedSongId: songId,
      isCorrect: songId === round.songId,
    },
  });

  return NextResponse.json({ ok: true });
}
