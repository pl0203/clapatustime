"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createRoomId, normalizeRoomInput } from "@/lib/room-utils";

export function HomeScreen() {
  const router = useRouter();
  const [joinInput, setJoinInput] = useState("");
  const [error, setError] = useState("");

  const startCall = () => {
    const roomId = createRoomId();
    router.push(`/room/${roomId}/setup?role=host`);
  };

  const handleJoin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const roomId = normalizeRoomInput(joinInput);
      setError("");
      router.push(`/room/${roomId}/setup?role=guest`);
    } catch (joinError) {
      setError(
        joinError instanceof Error
          ? joinError.message
          : "Enter a valid room link or code.",
      );
    }
  };

  return (
    <main className="min-h-screen px-5 py-6 text-slate-900 sm:px-8 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col rounded-[2rem] border fine-line panel-strong">
        <header className="flex items-center justify-between border-b fine-line px-6 py-5 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
              ClapatusTime
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Private video calls for two.
            </p>
          </div>
          <Link
            href="/join"
            className="rounded-full border fine-line bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
          >
            Join manually
          </Link>
        </header>

        <section className="grid flex-1 gap-10 px-6 py-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border border-slate-900/10 bg-white/60 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-500">
              Web-first MVP
            </p>
            <h1 className="display-type max-w-xl text-5xl leading-none text-slate-950 sm:text-6xl">
              Simple video calls that feel calm and effortless.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Start a private room, share the link, and join from desktop or
              mobile without creating an account.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={startCall}
                className="rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Start a call
              </button>
              <Link
                href="/join"
                className="rounded-full border fine-line bg-white/70 px-6 py-3.5 text-center text-sm font-semibold text-slate-800 transition hover:bg-white"
              >
                Join with a code
              </Link>
            </div>

            <form onSubmit={handleJoin} className="mt-10 max-w-xl">
              <label
                htmlFor="quick-join"
                className="mb-3 block text-sm font-medium text-slate-700"
              >
                Quick join with a room link or code
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="quick-join"
                  value={joinInput}
                  onChange={(event) => setJoinInput(event.target.value)}
                  placeholder="clapatustime.app/room/late-lantern or late-lantern"
                  className="min-w-0 flex-1 rounded-2xl border fine-line bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900/25"
                />
                <button
                  type="submit"
                  className="rounded-2xl border border-slate-900 bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Continue
                </button>
              </div>
              {error ? (
                <p className="mt-3 text-sm text-rose-600">{error}</p>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  This prototype generates private room links and keeps the flow
                  account-free.
                </p>
              )}
            </form>
          </div>

          <div className="panel rounded-[2rem] border fine-line p-4 sm:p-5">
            <div className="video-surface relative overflow-hidden rounded-[1.6rem] border border-white/12 p-5 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/65">
                    Live room
                  </p>
                  <p className="mt-2 text-2xl font-semibold">late-lantern</p>
                </div>
                <span className="rounded-full bg-emerald-400/18 px-3 py-1 text-xs font-medium text-emerald-200">
                  End-to-end feel
                </span>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-[1.25fr_0.75fr]">
                <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-5">
                  <div className="mb-20 h-2 w-24 rounded-full bg-white/15" />
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-lg font-semibold">Mia</p>
                      <p className="text-sm text-white/60">Connected on MacBook</p>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                      Camera on
                    </span>
                  </div>
                </div>

                <div className="rounded-[1.4rem] border border-white/10 bg-slate-950/45 p-4">
                  <div className="mb-14 h-2 w-16 rounded-full bg-white/12" />
                  <p className="text-base font-semibold">You</p>
                  <p className="text-sm text-white/60">Muted preview</p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2">
                {["Mic", "Cam", "Invite", "Leave"].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs font-medium text-white/72"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                "1:1 rooms",
                "Mobile ready",
                "No account friction",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.2rem] border fine-line bg-white/78 px-4 py-4 text-sm text-slate-600"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
