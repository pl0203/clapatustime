"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { normalizeRoomInput } from "@/lib/room-utils";

export function JoinScreen() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const roomId = normalizeRoomInput(input);
      setError("");
      router.push(`/room/${roomId}/setup?role=guest`);
    } catch (joinError) {
      setError(
        joinError instanceof Error
          ? joinError.message
          : "Enter a valid room link or room code.",
      );
    }
  };

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col rounded-[2rem] border fine-line panel-strong">
        <header className="flex items-center justify-between border-b fine-line px-6 py-5 sm:px-8">
          <BrandMark
            label="Join room"
            caption="Paste an invite link or enter a room code."
          />
          <Link
            href="/"
            className="rounded-full border fine-line bg-white/72 px-4 py-2 text-sm font-medium text-rose-950 transition hover:bg-white"
          >
            Back home
          </Link>
        </header>

        <section className="flex flex-1 items-center px-6 py-10 sm:px-8">
          <div className="w-full rounded-[1.8rem] border fine-line bg-white/84 p-6 sm:p-8">
            <h1 className="display-type text-4xl text-rose-950">
              Join in one step
            </h1>
            <p className="mt-3 max-w-lg text-base leading-7 text-rose-950/64">
              The room code can be something like{" "}
              <span className="font-semibold text-rose-950">late-lantern</span>{" "}
              or a full room URL copied from the host.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Paste room link or code"
                className="w-full rounded-[1.4rem] border fine-line bg-white px-4 py-3.5 text-sm text-rose-950 outline-none transition placeholder:text-rose-950/34 focus:border-rose-900/25"
              />
              <button
                type="submit"
                className="w-full rounded-[1.4rem] bg-rose-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-rose-900"
              >
                Continue to setup
              </button>
            </form>

            <div className="mt-4 rounded-[1.4rem] border fine-line bg-pink-50/70 px-4 py-4 text-sm text-rose-950/58">
              {error || "You will review your mic, camera, and display name before joining."}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
