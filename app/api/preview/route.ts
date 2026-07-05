import { NextResponse } from "next/server";
import { SONGS } from "@/app/lib/songs";

// Cheap in-memory cache; fine to lose on cold start since it just saves a
// redundant iTunes lookup during the same warm instance.
const previewCache = new Map<number, string | null>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const songId = Number(searchParams.get("songId"));
  const song = SONGS.find((s) => s.id === songId);
  if (!song) {
    return NextResponse.json({ error: "Unknown song" }, { status: 404 });
  }

  if (previewCache.has(songId)) {
    return NextResponse.json({ previewUrl: previewCache.get(songId) ?? null });
  }

  try {
    const term = encodeURIComponent(`${song.artist} ${song.title}`);
    const res = await fetch(
      `https://itunes.apple.com/search?term=${term}&entity=song&limit=1`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) throw new Error("iTunes lookup failed");
    const data = await res.json();
    const previewUrl: string | null = data?.results?.[0]?.previewUrl ?? null;
    // Only cache a real answer (found or confirmed not-found) — a network
    // error here shouldn't disable previews for a song for the rest of the
    // server's lifetime.
    previewCache.set(songId, previewUrl);
    return NextResponse.json({ previewUrl });
  } catch {
    return NextResponse.json({ previewUrl: null });
  }
}
