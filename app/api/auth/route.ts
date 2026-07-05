import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/lib/prisma";
import { createSession, deleteSession, getSession } from "@/app/lib/session";

export async function GET() {
  const session = await getSession();
  return NextResponse.json({ session });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const gameName = typeof body?.gameName === "string" ? body.gameName.trim() : "";
  const pin = typeof body?.pin === "string" ? body.pin.trim() : "";

  if (gameName.length < 2 || gameName.length > 20) {
    return NextResponse.json(
      { error: "Name must be 2-20 characters" },
      { status: 400 }
    );
  }
  if (!/^\d{4,6}$/.test(pin)) {
    return NextResponse.json(
      { error: "PIN must be 4-6 digits" },
      { status: 400 }
    );
  }

  const existing = await prisma.account.findUnique({ where: { gameName } });

  if (existing) {
    const valid = await bcrypt.compare(pin, existing.pinHash);
    if (!valid) {
      return NextResponse.json(
        { error: "That name is taken and the PIN doesn't match" },
        { status: 401 }
      );
    }
    await createSession(existing.id, existing.gameName);
    return NextResponse.json({ accountId: existing.id, gameName: existing.gameName });
  }

  const pinHash = await bcrypt.hash(pin, 10);
  const account = await prisma.account.create({ data: { gameName, pinHash } });
  await createSession(account.id, account.gameName);
  return NextResponse.json({ accountId: account.id, gameName: account.gameName });
}

export async function DELETE() {
  await deleteSession();
  return NextResponse.json({ ok: true });
}
