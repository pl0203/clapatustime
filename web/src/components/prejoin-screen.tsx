"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { useCameraPreview } from "@/hooks/use-camera-preview";
import { formatRoomLabel } from "@/lib/room-utils";

export function PrejoinScreen() {
  const router = useRouter();
  const params = useParams<{ roomId: string }>();
  const searchParams = useSearchParams();
  const roomId = params.roomId;
  const [displayName, setDisplayName] = useState(
    searchParams.get("name") ?? "",
  );
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStatus = useCameraPreview(videoRef, videoEnabled);

  const roomLabel = useMemo(() => formatRoomLabel(roomId), [roomId]);
  const cameraLabel = getCameraLabel(videoEnabled, cameraStatus);

  const joinCall = () => {
    const target = new URLSearchParams();
    target.set("name", displayName.trim() || "Guest");
    target.set("audio", String(audioEnabled));
    target.set("video", String(videoEnabled));

    const role = searchParams.get("role");
    if (role) {
      target.set("role", role);
    }

    router.push(`/room/${roomId}#${target.toString()}`);
  };

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col rounded-[2rem] border fine-line panel-strong">
        <header className="flex items-center justify-between border-b fine-line px-6 py-5 sm:px-8">
          <BrandMark label="Pre-join setup" caption={`Room ${roomLabel}`} />
          <Link
            href="/"
            className="rounded-full border fine-line bg-white/72 px-4 py-2 text-sm font-medium text-rose-950 transition hover:bg-white"
          >
            Exit
          </Link>
        </header>

        <section className="grid flex-1 gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="video-surface relative min-h-[440px] overflow-hidden rounded-[2rem] border border-white/12 p-6 text-white">
            {videoEnabled ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                  cameraStatus === "ready" ? "opacity-100" : "opacity-0"
                }`}
              />
            ) : null}

            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/5 to-black/55" />

            {cameraStatus !== "ready" ? (
              <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
                <div className="max-w-sm rounded-[1.4rem] border border-white/12 bg-white/8 px-5 py-4 backdrop-blur-xl">
                  <p className="text-base font-semibold">{cameraLabel}</p>
                  <p className="mt-2 text-sm leading-6 text-white/65">
                    {getCameraHelper(videoEnabled, cameraStatus)}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="relative z-10 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-white/60">
                  Preview
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {displayName.trim() || "You"}
                </p>
              </div>
              <div className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs text-white/70">
                {cameraLabel}
              </div>
            </div>

            <div className="absolute bottom-5 left-5 z-10 flex gap-2">
              <button
                type="button"
                onClick={() => setAudioEnabled((value) => !value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  audioEnabled
                    ? "bg-white/10 text-white"
                    : "bg-rose-400/22 text-rose-100"
                }`}
              >
                {audioEnabled ? "Mic on" : "Mic off"}
              </button>
              <button
                type="button"
                onClick={() => setVideoEnabled((value) => !value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  videoEnabled
                    ? "bg-white/10 text-white"
                    : "bg-amber-300/22 text-amber-100"
                }`}
              >
                {videoEnabled ? "Camera on" : "Camera off"}
              </button>
            </div>
          </div>

          <aside className="rounded-[2rem] border fine-line bg-white/84 p-6 sm:p-7">
            <h1 className="display-type text-4xl text-rose-950">
              Check a few things before joining
            </h1>
            <p className="mt-3 text-base leading-7 text-rose-950/64">
              For the first version we keep setup lightweight: choose your name,
              confirm your devices, and enter the room.
            </p>

            <div className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-rose-950/78">
                  Display name
                </span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Enter your name"
                  className="w-full rounded-[1.2rem] border fine-line bg-white px-4 py-3 text-sm text-rose-950 outline-none transition placeholder:text-rose-950/34 focus:border-rose-900/25"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setAudioEnabled((value) => !value)}
                  className="rounded-[1.2rem] border fine-line bg-rose-50/70 px-4 py-4 text-left transition hover:bg-white"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-rose-950/46">
                    Microphone
                  </p>
                  <p className="mt-2 text-lg font-semibold text-rose-950">
                    {audioEnabled ? "On" : "Muted"}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setVideoEnabled((value) => !value)}
                  className="rounded-[1.2rem] border fine-line bg-rose-50/70 px-4 py-4 text-left transition hover:bg-white"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-rose-950/46">
                    Camera
                  </p>
                  <p className="mt-2 text-lg font-semibold text-rose-950">
                    {videoEnabled ? "On" : "Off"}
                  </p>
                </button>
              </div>

              <div className="rounded-[1.2rem] border fine-line bg-pink-50/70 px-4 py-4 text-sm leading-6 text-rose-950/62">
                Browser camera preview is active here. Device selection will plug
                into this same screen when we wire up LiveKit.
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={joinCall}
                className="rounded-full bg-rose-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-rose-900"
              >
                Join room
              </button>
              <Link
                href="/"
                className="rounded-full border fine-line bg-white px-6 py-3.5 text-center text-sm font-semibold text-rose-950 transition hover:bg-rose-50"
              >
                Cancel
              </Link>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function getCameraLabel(videoEnabled: boolean, status: string) {
  if (!videoEnabled) {
    return "Camera off";
  }

  if (status === "ready") {
    return "Camera ready";
  }

  if (status === "starting") {
    return "Starting camera";
  }

  if (status === "unavailable") {
    return "Camera unavailable";
  }

  if (status === "blocked") {
    return "Camera blocked";
  }

  return "Camera ready";
}

function getCameraHelper(videoEnabled: boolean, status: string) {
  if (!videoEnabled) {
    return "Turn the camera back on whenever you want to preview video.";
  }

  if (status === "starting") {
    return "Your browser may ask for permission before the preview appears.";
  }

  if (status === "unavailable") {
    return "This browser or connection cannot access camera preview right now.";
  }

  if (status === "blocked") {
    return "Allow camera access in the browser, then refresh or toggle camera off and on.";
  }

  return "Waiting for camera access.";
}
