import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSession } from "@/app/lib/session";
import { MIN_PLAYERS, pickRound } from "@/app/lib/room";
import type { Difficulty } from "@/app/lib/songs";

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
    include: { players: true },
  });
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  if (room.hostId !== session.accountId) {
    return NextResponse.json(
      { error: "Only the host can start the game" },
      { status: 403 }
    );
  }
  if (room.status !== "lobby") {
    return NextResponse.json({ error: "Game already started" }, { status: 409 });
  }
  if (room.players.length < MIN_PLAYERS) {
    return NextResponse.json(
      { error: `Need at least ${MIN_PLAYERS} players to start` },
      { status: 400 }
    );
  }

  const { songId, optionIds } = pickRound([], room.difficulty as Difficulty);
  await prisma.$transaction([
    prisma.round.create({
      data: { roomId: room.id, roundNumber: 1, songId, optionIds },
    }),
    prisma.gameRoom.update({
      where: { id: room.id },
      data: { status: "active", currentRound: 1 },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
