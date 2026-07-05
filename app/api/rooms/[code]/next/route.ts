import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSession } from "@/app/lib/session";
import { computeRoundPhase, pickRound } from "@/app/lib/room";

export async function POST(
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
      players: true,
      rounds: { orderBy: { roundNumber: "desc" }, take: 1, include: { guesses: true } },
    },
  });
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  if (room.hostId !== session.accountId) {
    return NextResponse.json(
      { error: "Only the host can advance the round" },
      { status: 403 }
    );
  }
  if (room.status !== "active") {
    return NextResponse.json({ error: "Game isn't active" }, { status: 409 });
  }

  const round = room.rounds[0];
  if (round) {
    const { revealed } = computeRoundPhase(
      round.startedAt,
      round.guesses.length,
      room.players.length
    );
    if (!revealed) {
      return NextResponse.json(
        { error: "Round hasn't been revealed yet" },
        { status: 409 }
      );
    }
  }

  if (room.currentRound >= room.totalRounds) {
    await prisma.gameRoom.update({
      where: { id: room.id },
      data: { status: "finished" },
    });
    return NextResponse.json({ ok: true, finished: true });
  }

  const priorSongIds = (
    await prisma.round.findMany({ where: { roomId: room.id }, select: { songId: true } })
  ).map((r) => r.songId);
  const { songId, optionIds } = pickRound(priorSongIds);
  const nextRoundNumber = room.currentRound + 1;

  await prisma.$transaction([
    prisma.round.create({
      data: { roomId: room.id, roundNumber: nextRoundNumber, songId, optionIds },
    }),
    prisma.gameRoom.update({
      where: { id: room.id },
      data: { currentRound: nextRoundNumber },
    }),
  ]);

  return NextResponse.json({ ok: true, finished: false });
}
