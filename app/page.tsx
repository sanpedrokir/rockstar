import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-black text-white font-sans px-6 py-20 gap-10 text-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight">
          🎸 Rockstar
        </h1>
        <p className="max-w-md text-lg text-zinc-400">
          Shred through classic rock anthems and test your ear against
          friends. Two ways to play:
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link
          href="/game"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-black font-semibold transition-colors hover:bg-zinc-200"
        >
          🎸 Rock &amp; Roll Hero
        </Link>
        <Link
          href="/game/guess"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-zinc-600 font-semibold transition-colors hover:bg-zinc-800"
        >
          🎤 Guess the Song (multiplayer)
        </Link>
      </div>

      <p className="text-zinc-500 text-sm max-w-sm">
        Rock &amp; Roll Hero is a solo rhythm game — hit the notes as they
        drop. Guess the Song is a multiplayer room where you race to name the
        track and artist.
      </p>
    </div>
  );
}
