"use client";

import {
  Camera,
  CameraOff,
  Copy,
  LogOut,
  Mic,
  MicOff,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useLiveKitCall } from "@/hooks/use-livekit-call";
import { formatRoomLabel } from "@/lib/room-utils";

export function CallRoomScreen() {
  const params = useParams<{ roomId: string }>();
  const searchParams = useSearchParams();
  const roomId = params.roomId;
  const roomLabel = useMemo(() => formatRoomLabel(roomId), [roomId]);
  const [audioEnabled, setAudioEnabled] = useState(
    searchParams.get("audio") !== "false",
  );
  const [videoEnabled, setVideoEnabled] = useState(
    searchParams.get("video") !== "false",
  );
  const [copied, setCopied] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const displayName = searchParams.get("name") || "Guest";
  const role = searchParams.get("role") || "guest";
  const fallbackRemoteName = role === "guest" ? "Host" : "Guest";
  const call = useLiveKitCall({
    roomId,
    displayName,
    initialAudioEnabled: audioEnabled,
    initialVideoEnabled: videoEnabled,
    localVideoRef,
    remoteVideoRef,
    remoteAudioRef,
  });
  const visibleRemoteName =
    call.remoteName === "Waiting" ? fallbackRemoteName : call.remoteName;

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/room/${roomId}/setup?role=guest`,
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const toggleAudio = async () => {
    const nextValue = !audioEnabled;
    setAudioEnabled(nextValue);
    await call.setMicrophoneEnabled(nextValue);
  };

  const toggleVideo = async () => {
    const nextValue = !videoEnabled;
    setVideoEnabled(nextValue);
    await call.setCameraEnabled(nextValue);
  };

  return (
    <main className="call-page">
      <section className="call-stage">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="call-remote-video"
        />
        <audio ref={remoteAudioRef} autoPlay />

        <div className="call-scrim" />

        <header className="call-topbar">
          <div className="call-room-chip">
            <p className="call-eyebrow">ClapatusTime</p>
            <h1>{roomLabel}</h1>
          </div>

          <div className="call-status-chip">
            <Users aria-hidden="true" size={16} />
            <span>
              {call.participantCount} participant
              {call.participantCount === 1 ? "" : "s"}
            </span>
            <span className="call-status-dot" />
            <span>{formatStatus(call.status)}</span>
          </div>
        </header>

        {call.participantCount === 1 ? (
          <div className="call-waiting">
            <div>
              <p>Waiting for the other person</p>
              <span>Share the invite link and keep this room open.</span>
            </div>
          </div>
        ) : null}

        <div className="call-nameplate">
          <p>Remote</p>
          <strong>{visibleRemoteName}</strong>
          {call.error ? <span>{call.error}</span> : null}
        </div>

        <aside className="call-self-tile">
          {videoEnabled ? (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="call-self-video"
            />
          ) : (
            <div className="call-camera-off">
              <CameraOff aria-hidden="true" size={30} />
            </div>
          )}
          <div className="call-self-label">
            <span>You</span>
            <small>{videoEnabled ? "Camera on" : "Camera off"}</small>
          </div>
        </aside>

        <footer className="call-controls">
          <ControlButton
            label={audioEnabled ? "Mute" : "Unmute"}
            active={audioEnabled}
            danger={!audioEnabled}
            onClick={toggleAudio}
          >
            {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
          </ControlButton>
          <ControlButton
            label={videoEnabled ? "Stop video" : "Start video"}
            active={videoEnabled}
            danger={!videoEnabled}
            onClick={toggleVideo}
          >
            {videoEnabled ? <Camera size={20} /> : <CameraOff size={20} />}
          </ControlButton>
          <ControlButton
            label={copied ? "Copied" : "Invite"}
            active
            onClick={copyInviteLink}
          >
            <Copy size={20} />
          </ControlButton>
          <Link
            href="/"
            aria-label="Leave call"
            title="Leave call"
            className="call-control call-control-leave"
          >
            <LogOut aria-hidden="true" size={20} />
            <span>Leave</span>
          </Link>
        </footer>
      </section>
    </main>
  );
}

function ControlButton({
  label,
  active,
  danger = false,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`call-control ${
        danger
          ? "call-control-danger"
          : active
            ? "call-control-active"
            : "call-control-muted"
      }`}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}

function formatStatus(status: string) {
  if (status === "connecting") {
    return "Connecting";
  }

  if (status === "reconnecting") {
    return "Reconnecting";
  }

  if (status === "connected") {
    return "Connected";
  }

  if (status === "error") {
    return "Error";
  }

  return "Waiting";
}
