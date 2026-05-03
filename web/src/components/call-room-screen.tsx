"use client";

import {
  AlertTriangle,
  Camera,
  CameraOff,
  Copy,
  FlipHorizontal2,
  Loader2,
  LogOut,
  Mic,
  MicOff,
  PictureInPicture,
  RefreshCcw,
  SwitchCamera,
  Users,
  Volume2,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useLiveKitCall } from "@/hooks/use-livekit-call";
import { useScreenWakeLock } from "@/hooks/use-screen-wake-lock";
import { formatRoomLabel } from "@/lib/room-utils";

type VideoFacingMode = "user" | "environment";

export function CallRoomScreen() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;
  const roomLabel = useMemo(() => formatRoomLabel(roomId), [roomId]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [cameraFacingMode, setCameraFacingMode] =
    useState<VideoFacingMode>("user");
  const [cameraMirrored, setCameraMirrored] = useState(true);
  const [pictureInPictureAvailable, setPictureInPictureAvailable] =
    useState(false);
  const [pictureInPictureActive, setPictureInPictureActive] = useState(false);
  const [initialMedia, setInitialMedia] = useState({
    audioEnabled: true,
    videoEnabled: true,
  });
  const [displayName, setDisplayName] = useState("Guest");
  const [role, setRole] = useState("guest");
  const [joinConfigReady, setJoinConfigReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : "";
    const hashParams = new URLSearchParams(hash);

    startTransition(() => {
      const nextAudioEnabled = hashParams.get("audio") !== "false";
      const nextVideoEnabled = hashParams.get("video") !== "false";
      const nextFacingMode = prefersBackCamera() ? "environment" : "user";

      setDisplayName(hashParams.get("name")?.trim() || "Guest");
      setRole(hashParams.get("role") || "guest");
      setAudioEnabled(nextAudioEnabled);
      setVideoEnabled(nextVideoEnabled);
      setCameraFacingMode(nextFacingMode);
      setCameraMirrored(nextFacingMode === "user");
      setInitialMedia({
        audioEnabled: nextAudioEnabled,
        videoEnabled: nextVideoEnabled,
      });
      setJoinConfigReady(true);
    });

    if (window.location.hash) {
      window.history.replaceState(
        window.history.state,
        "",
        `/room/${roomId}`,
      );
    }
  }, [roomId]);

  useEffect(() => {
    const videoElement = remoteVideoRef.current;
    if (!videoElement) {
      return;
    }

    const updatePictureInPictureState = () => {
      setPictureInPictureAvailable(canUsePictureInPicture(videoElement));
      setPictureInPictureActive(isPictureInPictureActive(videoElement));
    };

    updatePictureInPictureState();
    videoElement.addEventListener("enterpictureinpicture", updatePictureInPictureState);
    videoElement.addEventListener("leavepictureinpicture", updatePictureInPictureState);
    videoElement.addEventListener(
      "webkitpresentationmodechanged",
      updatePictureInPictureState,
    );

    return () => {
      videoElement.removeEventListener(
        "enterpictureinpicture",
        updatePictureInPictureState,
      );
      videoElement.removeEventListener(
        "leavepictureinpicture",
        updatePictureInPictureState,
      );
      videoElement.removeEventListener(
        "webkitpresentationmodechanged",
        updatePictureInPictureState,
      );
    };
  }, []);

  const fallbackRemoteName = role === "guest" ? "Host" : "Guest";
  const call = useLiveKitCall({
    roomId,
    displayName,
    initialAudioEnabled: initialMedia.audioEnabled,
    initialVideoEnabled: initialMedia.videoEnabled,
    initialVideoFacingMode: cameraFacingMode,
    localVideoRef,
    remoteVideoRef,
    remoteAudioRef,
    enabled: joinConfigReady,
  });
  useScreenWakeLock(
    call.status === "connected" || call.status === "reconnecting",
  );
  const visibleRemoteName =
    call.remoteName === "Waiting" ? fallbackRemoteName : call.remoteName;
  const notice = getCallNotice({
    status: call.status,
    error: call.error,
    audioPlaybackBlocked: call.audioPlaybackBlocked,
  });

  const resumeAudioIfNeeded = async () => {
    if (!call.audioPlaybackBlocked) {
      return;
    }

    await call.startAudio().catch(() => undefined);
  };

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
    await resumeAudioIfNeeded();
    await call.setMicrophoneEnabled(nextValue);
  };

  const toggleVideo = async () => {
    const nextValue = !videoEnabled;
    setVideoEnabled(nextValue);
    await resumeAudioIfNeeded();
    await call.setCameraEnabled(nextValue, cameraFacingMode);
  };

  const switchCamera = async () => {
    if (!videoEnabled) {
      return;
    }

    const previousFacingMode = cameraFacingMode;
    const previousMirrorState = cameraMirrored;
    const nextFacingMode =
      cameraFacingMode === "user" ? "environment" : "user";

    setCameraFacingMode(nextFacingMode);
    setCameraMirrored(nextFacingMode === "user");

    try {
      await call.setCameraFacingMode(nextFacingMode);
    } catch {
      setCameraFacingMode(previousFacingMode);
      setCameraMirrored(previousMirrorState);
    }
  };

  const toggleCameraMirror = () => {
    setCameraMirrored((mirrored) => !mirrored);
  };

  const togglePictureInPicture = async () => {
    const videoElement = remoteVideoRef.current;
    if (!videoElement) {
      return;
    }

    await toggleVideoPictureInPicture(videoElement).catch(() => undefined);
    setPictureInPictureActive(isPictureInPictureActive(videoElement));
    setPictureInPictureAvailable(canUsePictureInPicture(videoElement));
  };

  const resumeAudio = async () => {
    await call.startAudio().catch(() => undefined);
  };

  const retryCall = () => {
    call.retry();
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
            <div className="brand-logo brand-logo-compact" aria-hidden="true">
              👏
            </div>
            <div>
              <p className="call-eyebrow">ClapatusTime</p>
              <h1>{roomLabel}</h1>
            </div>
          </div>

          <div className="call-status-chip">
            <Users aria-hidden="true" size={16} />
            <span>
              {call.participantCount} participant
              {call.participantCount === 1 ? "" : "s"}
            </span>
            <span
              className={`call-status-dot call-status-dot-${getStatusTone(call.status)}`}
            />
            <span>{formatStatus(call.status)}</span>
          </div>
        </header>

        {call.status === "connecting" ? (
          <div className="call-loading" aria-live="polite">
            <Loader2 aria-hidden="true" size={26} />
            <div>
              <p>Joining room</p>
              <span>Setting up encrypted audio and video.</span>
            </div>
          </div>
        ) : null}

        {call.status === "connected" && call.participantCount === 1 ? (
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
          {call.error ? <span>{shortenError(call.error)}</span> : null}
        </div>

        <aside className="call-self-tile">
          {videoEnabled ? (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`call-self-video ${
                cameraMirrored ? "call-self-video-mirrored" : ""
              }`}
            />
          ) : (
            <div className="call-camera-off">
              <CameraOff aria-hidden="true" size={30} />
            </div>
          )}
          <div className="call-self-label">
            <span>You</span>
            <small>
              {videoEnabled
                ? cameraFacingMode === "environment"
                  ? "Back camera"
                  : "Front camera"
                : "Camera off"}
            </small>
          </div>
        </aside>

        {notice ? (
          <div className={`call-notice call-notice-${notice.tone}`} role="status">
            {notice.tone === "loading" ? (
              <Loader2 aria-hidden="true" size={18} />
            ) : notice.tone === "error" ? (
              <AlertTriangle aria-hidden="true" size={18} />
            ) : (
              <Volume2 aria-hidden="true" size={18} />
            )}
            <div>
              <strong>{notice.title}</strong>
              <span>{notice.body}</span>
            </div>
            {notice.action === "retry" ? (
              <button type="button" onClick={retryCall}>
                <RefreshCcw aria-hidden="true" size={16} />
                <span>Retry</span>
              </button>
            ) : notice.action === "audio" ? (
              <button type="button" onClick={resumeAudio}>
                <Volume2 aria-hidden="true" size={16} />
                <span>Resume</span>
              </button>
            ) : null}
          </div>
        ) : null}

        <footer className="call-controls">
          {call.audioPlaybackBlocked ? (
            <ControlButton label="Resume audio" active onClick={resumeAudio}>
              <Volume2 size={20} />
            </ControlButton>
          ) : null}
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
            label={
              cameraFacingMode === "user" ? "Back camera" : "Front camera"
            }
            active={videoEnabled}
            disabled={!videoEnabled}
            onClick={switchCamera}
          >
            <SwitchCamera size={20} />
          </ControlButton>
          <ControlButton
            label={cameraMirrored ? "Unmirror" : "Mirror"}
            active={cameraMirrored}
            disabled={!videoEnabled}
            onClick={toggleCameraMirror}
          >
            <FlipHorizontal2 size={20} />
          </ControlButton>
          {pictureInPictureAvailable ? (
            <ControlButton
              label={
                pictureInPictureActive ? "Close picture" : "Picture in picture"
              }
              active={pictureInPictureActive}
              onClick={togglePictureInPicture}
            >
              <PictureInPicture size={20} />
            </ControlButton>
          ) : null}
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
  disabled = false,
}: {
  label: string;
  active: boolean;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`call-control ${
        disabled
          ? "call-control-disabled"
          : danger
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

function getStatusTone(status: string) {
  if (status === "connected") {
    return "connected";
  }

  if (status === "reconnecting" || status === "connecting") {
    return "pending";
  }

  if (status === "error" || status === "disconnected") {
    return "error";
  }

  return "idle";
}

function getCallNotice({
  status,
  error,
  audioPlaybackBlocked,
}: {
  status: string;
  error: string;
  audioPlaybackBlocked: boolean;
}) {
  if (audioPlaybackBlocked) {
    return {
      tone: "warning",
      title: "Audio needs a tap",
      body: "Your browser paused playback. Resume audio to hear the room.",
      action: "audio",
    };
  }

  if (status === "reconnecting") {
    return {
      tone: "loading",
      title: "Reconnecting",
      body: "Keeping your mic and camera ready while the call recovers.",
      action: null,
    };
  }

  if (status === "error" || status === "disconnected") {
    return {
      tone: "error",
      title: status === "error" ? "Could not join" : "Call disconnected",
      body: error || "Check your connection and try again.",
      action: "retry",
    };
  }

  return null;
}

function shortenError(error: string) {
  return error.length > 72 ? `${error.slice(0, 69)}...` : error;
}

function prefersBackCamera() {
  const userAgent = navigator.userAgent.toLowerCase();
  const isPhone = /android.*mobile|iphone|ipod/.test(userAgent);
  return isPhone;
}

type PictureInPictureVideoElement = HTMLVideoElement & {
  requestPictureInPicture?: () => Promise<PictureInPictureWindow>;
  webkitPresentationMode?: "inline" | "fullscreen" | "picture-in-picture";
  webkitSetPresentationMode?: (
    mode: "inline" | "fullscreen" | "picture-in-picture",
  ) => void;
  webkitSupportsPresentationMode?: (
    mode: "inline" | "fullscreen" | "picture-in-picture",
  ) => boolean;
};

function canUsePictureInPicture(videoElement: HTMLVideoElement) {
  const video = videoElement as PictureInPictureVideoElement;
  const supportsStandardPictureInPicture =
    document.pictureInPictureEnabled &&
    typeof video.requestPictureInPicture === "function";
  const supportsSafariPictureInPicture =
    typeof video.webkitSupportsPresentationMode === "function" &&
    video.webkitSupportsPresentationMode("picture-in-picture") &&
    typeof video.webkitSetPresentationMode === "function";

  return supportsStandardPictureInPicture || supportsSafariPictureInPicture;
}

function isPictureInPictureActive(videoElement: HTMLVideoElement) {
  const video = videoElement as PictureInPictureVideoElement;

  return (
    document.pictureInPictureElement === videoElement ||
    video.webkitPresentationMode === "picture-in-picture"
  );
}

async function toggleVideoPictureInPicture(videoElement: HTMLVideoElement) {
  const video = videoElement as PictureInPictureVideoElement;

  if (document.pictureInPictureElement) {
    await document.exitPictureInPicture();
    return;
  }

  if (
    document.pictureInPictureEnabled &&
    typeof video.requestPictureInPicture === "function"
  ) {
    await video.requestPictureInPicture();
    return;
  }

  if (
    typeof video.webkitSupportsPresentationMode === "function" &&
    video.webkitSupportsPresentationMode("picture-in-picture") &&
    typeof video.webkitSetPresentationMode === "function"
  ) {
    video.webkitSetPresentationMode(
      video.webkitPresentationMode === "picture-in-picture"
        ? "inline"
        : "picture-in-picture",
    );
  }
}
