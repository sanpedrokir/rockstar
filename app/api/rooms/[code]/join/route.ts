import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSession } from "@/app/lib/session";
import { MAX_PLAYERS } from "@/app/lib/room";

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
    return NextResponse.json({ error: "No room with that code" }, { status: 404 });
  }

  const alreadyIn = room.players.some((p) => p.accountId === session.accountId);
  if (!alreadyIn) {
    if (room.status !== "lobby") {
      return NextResponse.json(
        { error: "That game has already started" },
        { status: 409 }
      );
    }
    if (room.players.length >= MAX_PLAYERS) {
      return NextResponse.json({ error: "Room is full" }, { status: 409 });
    }
    await prisma.roomPlayer.create({
      data: { roomId: room.id, accountId: session.accountId },
    });
  }

  return NextResponse.json({ roomCode: room.roomCode });
}
