"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type You = { accountId: number; gameName: string };

export default function Home() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [you, setYou] = useState<You | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((data) => {
        if (data.session) {
          setYou({ accountId: data.session.accountId, gameName: data.session.gameName });
        }
      })
      .finally(() => setCheckingSession(false));
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthBusy(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameName: nameInput, pin: pinInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error ?? "Couldn't sign in");
        return;
      }
      setYou({ accountId: data.accountId, gameName: data.gameName });
    } finally {
      setAuthBusy(false);
    }
  };

  const switchPlayer = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    setYou(null);
  };

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

      {checkingSession && <p className="text-zinc-400">Loading...</p>}

      {!checkingSession && !you && (
        <form
          onSubmit={handleAuth}
          className="w-full max-w-sm bg-zinc-900 border-2 border-zinc-700 rounded-lg p-6 flex flex-col gap-3 text-left"
        >
          <p className="text-zinc-400 text-sm text-center">
            Sign in with a name and PIN. If that name doesn&apos;t exist yet,
            it&apos;ll be created for you.
          </p>
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Your name"
            maxLength={20}
            className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 font-mono"
          />
          <input
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
            placeholder="4-6 digit PIN"
            inputMode="numeric"
            maxLength={6}
            className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 font-mono"
          />
          {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
          <button
            type="submit"
            disabled={authBusy}
            className="rounded-full bg-white text-black px-6 py-3 font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {authBusy ? "..." : "Continue"}
          </button>
        </form>
      )}

      {!checkingSession && you && (
        <>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            Playing as <span className="text-white font-semibold">{you.gameName}</span>
            <button onClick={switchPlayer} className="text-xs text-zinc-500 hover:text-white underline">
              switch player
            </button>
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
            drop. Guess the Song is a multiplayer room where you race to name
            the track and artist.
          </p>
        </>
      )}
    </div>
  );
}
