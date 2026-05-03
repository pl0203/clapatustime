"use client";

import {
  ExternalE2EEKeyProvider,
  Room,
  RoomEvent,
  Track,
  type ConnectionState,
  type DisconnectReason,
  type LocalTrackPublication,
  type RemoteParticipant,
  type RemoteTrack,
  type RemoteTrackPublication,
} from "livekit-client";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";

type CallStatus = "idle" | "connecting" | "connected" | "reconnecting" | "disconnected" | "error";

type UseLiveKitCallOptions = {
  roomId: string;
  displayName: string;
  initialAudioEnabled: boolean;
  initialVideoEnabled: boolean;
  initialVideoFacingMode: VideoFacingMode;
  enabled: boolean;
  localVideoRef: RefObject<HTMLVideoElement | null>;
  remoteVideoRef: RefObject<HTMLVideoElement | null>;
  remoteAudioRef: RefObject<HTMLAudioElement | null>;
};

type VideoFacingMode = "user" | "environment";

export function useLiveKitCall({
  roomId,
  displayName,
  initialAudioEnabled,
  initialVideoEnabled,
  initialVideoFacingMode,
  enabled,
  localVideoRef,
  remoteVideoRef,
  remoteAudioRef,
}: UseLiveKitCallOptions) {
  const roomRef = useRef<Room | null>(null);
  const initialAudioRef = useRef(initialAudioEnabled);
  const initialVideoRef = useRef(initialVideoEnabled);
  const videoFacingModeRef = useRef<VideoFacingMode>(initialVideoFacingMode);
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [error, setError] = useState("");
  const [participantCount, setParticipantCount] = useState(1);
  const [remoteName, setRemoteName] = useState("Waiting");
  const [audioPlaybackBlocked, setAudioPlaybackBlocked] = useState(false);

  useEffect(() => {
    initialAudioRef.current = initialAudioEnabled;
    initialVideoRef.current = initialVideoEnabled;
    videoFacingModeRef.current = initialVideoFacingMode;
  }, [initialAudioEnabled, initialVideoEnabled, initialVideoFacingMode]);

  const attachLocalVideo = useCallback(() => {
    const room = roomRef.current;
    const videoElement = localVideoRef.current;
    const publication = room?.localParticipant.getTrackPublication(
      Track.Source.Camera,
    );

    if (!videoElement || !publication?.videoTrack) {
      return;
    }

    publication.videoTrack.attach(videoElement);
  }, [localVideoRef]);

  const attachRemoteTrack = useCallback(
    (track: RemoteTrack, participant: RemoteParticipant) => {
      setRemoteName(participant.name || participant.identity || "Guest");

      if (track.kind === Track.Kind.Video && remoteVideoRef.current) {
        track.attach(remoteVideoRef.current);
      }

      if (track.kind === Track.Kind.Audio && remoteAudioRef.current) {
        track.attach(remoteAudioRef.current);
        void remoteAudioRef.current.play().catch(() => undefined);
      }
    },
    [remoteAudioRef, remoteVideoRef],
  );

  const refreshParticipants = useCallback(() => {
    const room = roomRef.current;
    if (!room) {
      setParticipantCount(1);
      setRemoteName("Waiting");
      return;
    }

    setParticipantCount(1 + room.remoteParticipants.size);
    const firstRemote = Array.from(room.remoteParticipants.values())[0];
    setRemoteName(firstRemote?.name || firstRemote?.identity || "Waiting");
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;
    const e2ee = createE2EEOptions();
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      ...(e2ee
        ? {
            encryption: {
              keyProvider: e2ee.keyProvider,
              worker: e2ee.worker,
            },
          }
        : {}),
    });

    roomRef.current = room;

    const handleConnectionStateChanged = (state: ConnectionState) => {
      if (state === "connected") {
        setStatus("connected");
        setError("");
      } else if (state === "reconnecting") {
        setStatus("reconnecting");
      } else if (state === "disconnected") {
        setStatus("disconnected");
      }
    };

    const handleDisconnected = (reason?: DisconnectReason) => {
      if (cancelled) {
        return;
      }

      setStatus("disconnected");
      setError(formatDisconnectReason(reason));
      refreshParticipants();
    };

    const handleParticipantChange = () => {
      refreshParticipants();
    };

    const handleAudioPlaybackStatusChanged = (playing: boolean) => {
      setAudioPlaybackBlocked(!playing || !room.canPlaybackAudio);
    };

    const handleMediaDevicesError = (
      deviceError: Error,
      kind?: MediaDeviceKind,
    ) => {
      const device =
        kind === "audioinput"
          ? "microphone"
          : kind === "videoinput"
            ? "camera"
            : "device";

      setError(
        `${capitalize(device)} access failed: ${deviceError.message}. Check browser permissions and try again.`,
      );
    };

    const handleTrackSubscribed = (
      track: RemoteTrack,
      _publication: RemoteTrackPublication,
      participant: RemoteParticipant,
    ) => {
      attachRemoteTrack(track, participant);
    };

    const handleTrackUnsubscribed = (track: RemoteTrack) => {
      track.detach().forEach((element) => element.removeAttribute("srcObject"));
    };

    const handleLocalTrackPublished = (
      publication: LocalTrackPublication,
    ) => {
      if (publication.source === Track.Source.Camera) {
        attachLocalVideo();
      }
    };

    room
      .on(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged)
      .on(RoomEvent.Disconnected, handleDisconnected)
      .on(RoomEvent.ParticipantConnected, handleParticipantChange)
      .on(RoomEvent.ParticipantDisconnected, handleParticipantChange)
      .on(RoomEvent.MediaDevicesError, handleMediaDevicesError)
      .on(RoomEvent.AudioPlaybackStatusChanged, handleAudioPlaybackStatusChanged)
      .on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
      .on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
      .on(RoomEvent.LocalTrackPublished, handleLocalTrackPublished);

    async function connectToRoom() {
      setStatus("connecting");
      setError("");

      try {
        const response = await fetch("/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomId,
            displayName,
          }),
        });

        if (!response.ok) {
          const details = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;

          throw new Error(details?.error || "Could not create a LiveKit token.");
        }

        const { token, url, encryptionKey } = (await response.json()) as {
          token: string;
          url: string;
          encryptionKey: string;
        };

        if (e2ee) {
          await e2ee.keyProvider.setKey(encryptionKey);
          await room.setE2EEEnabled(true);
        }
        await room.connect(url, token);

        if (cancelled) {
          room.disconnect();
          return;
        }

        await room.localParticipant.setMicrophoneEnabled(
          initialAudioRef.current,
        );
        await room.localParticipant.setCameraEnabled(initialVideoRef.current, {
          facingMode: videoFacingModeRef.current,
        });
        attachLocalVideo();

        room.remoteParticipants.forEach((participant) => {
          participant.trackPublications.forEach((publication) => {
            if (publication.track) {
              attachRemoteTrack(publication.track, participant);
            }
          });
        });

        refreshParticipants();
        setAudioPlaybackBlocked(!room.canPlaybackAudio);
        setStatus("connected");
      } catch (connectError) {
        setStatus("error");
        setError(
          connectError instanceof Error
            ? connectError.message
            : "Could not connect to the call.",
        );
      }
    }

    void connectToRoom();

    return () => {
      cancelled = true;
      room.disconnect();
      roomRef.current = null;
      e2ee?.worker.terminate();
    };
  }, [
    attachLocalVideo,
    attachRemoteTrack,
    connectionAttempt,
    displayName,
    enabled,
    refreshParticipants,
    roomId,
  ]);

  const setMicrophoneEnabled = useCallback(async (enabled: boolean) => {
    await roomRef.current?.localParticipant.setMicrophoneEnabled(enabled);
  }, []);

  const setCameraEnabled = useCallback(
    async (enabled: boolean, facingMode = videoFacingModeRef.current) => {
      videoFacingModeRef.current = facingMode;
      await roomRef.current?.localParticipant.setCameraEnabled(enabled, {
        facingMode,
      });
      if (enabled) {
        window.setTimeout(attachLocalVideo, 0);
      }
    },
    [attachLocalVideo],
  );

  const setCameraFacingMode = useCallback(
    async (facingMode: VideoFacingMode) => {
      const room = roomRef.current;
      videoFacingModeRef.current = facingMode;

      const publication = room?.localParticipant.getTrackPublication(
        Track.Source.Camera,
      );

      if (publication?.videoTrack) {
        await publication.videoTrack.restartTrack({ facingMode });
        window.setTimeout(attachLocalVideo, 0);
      }
    },
    [attachLocalVideo],
  );

  const startAudio = useCallback(async () => {
    const room = roomRef.current;
    if (!room) {
      return;
    }

    await room.startAudio();
    setAudioPlaybackBlocked(!room.canPlaybackAudio);
  }, []);

  const retry = useCallback(() => {
    setError("");
    setAudioPlaybackBlocked(false);
    setConnectionAttempt((attempt) => attempt + 1);
  }, []);

  return {
    status,
    error,
    participantCount,
    remoteName,
    audioPlaybackBlocked,
    setMicrophoneEnabled,
    setCameraEnabled,
    setCameraFacingMode,
    startAudio,
    retry,
  };
}

function formatDisconnectReason(reason?: DisconnectReason) {
  if (!reason) {
    return "The call disconnected. Try reconnecting.";
  }

  const reasonText = String(reason).replace(/_/g, " ").toLowerCase();
  return `The call disconnected (${reasonText}). Try reconnecting.`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function createE2EEOptions() {
  try {
    const keyProvider = new ExternalE2EEKeyProvider();
    const worker = new Worker(
      new URL("livekit-client/e2ee-worker", import.meta.url),
      {
        type: "module",
      },
    );

    return { keyProvider, worker };
  } catch {
    return null;
  }
}
