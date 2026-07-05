import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSession } from "@/app/lib/session";
import { generateRoomCode, TOTAL_ROUNDS } from "@/app/lib/room";
import { DIFFICULTIES, type Difficulty } from "@/app/lib/songs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const requestedDifficulty = body?.difficulty;
  const difficulty: Difficulty = DIFFICULTIES.includes(requestedDifficulty)
    ? requestedDifficulty
    : "normal";

  for (let attempt = 0; attempt < 5; attempt++) {
    const roomCode = generateRoomCode();
    try {
      const room = await prisma.gameRoom.create({
        data: {
          roomCode,
          hostId: session.accountId,
          totalRounds: TOTAL_ROUNDS,
          difficulty,
          players: { create: { accountId: session.accountId } },
        },
      });
      return NextResponse.json({ roomCode: room.roomCode });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "P2002") continue; // room code collision, retry
      throw err;
    }
  }
  return NextResponse.json(
    { error: "Could not create a room, please try again" },
    { status: 500 }
  );
}
