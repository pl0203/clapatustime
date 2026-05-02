"use client";

import {
  Room,
  RoomEvent,
  Track,
  type ConnectionState,
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
  localVideoRef: RefObject<HTMLVideoElement | null>;
  remoteVideoRef: RefObject<HTMLVideoElement | null>;
  remoteAudioRef: RefObject<HTMLAudioElement | null>;
};

export function useLiveKitCall({
  roomId,
  displayName,
  initialAudioEnabled,
  initialVideoEnabled,
  localVideoRef,
  remoteVideoRef,
  remoteAudioRef,
}: UseLiveKitCallOptions) {
  const roomRef = useRef<Room | null>(null);
  const initialAudioRef = useRef(initialAudioEnabled);
  const initialVideoRef = useRef(initialVideoEnabled);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [error, setError] = useState("");
  const [participantCount, setParticipantCount] = useState(1);
  const [remoteName, setRemoteName] = useState("Waiting");

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
    let cancelled = false;
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });

    roomRef.current = room;

    const handleConnectionStateChanged = (state: ConnectionState) => {
      if (state === "connected") {
        setStatus("connected");
      } else if (state === "reconnecting") {
        setStatus("reconnecting");
      } else if (state === "disconnected") {
        setStatus("disconnected");
      }
    };

    const handleParticipantChange = () => {
      refreshParticipants();
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
      .on(RoomEvent.ParticipantConnected, handleParticipantChange)
      .on(RoomEvent.ParticipantDisconnected, handleParticipantChange)
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
          throw new Error("Could not create a LiveKit token.");
        }

        const { token, url } = (await response.json()) as {
          token: string;
          url: string;
        };

        await room.connect(url, token);

        if (cancelled) {
          room.disconnect();
          return;
        }

        await room.localParticipant.setMicrophoneEnabled(
          initialAudioRef.current,
        );
        await room.localParticipant.setCameraEnabled(initialVideoRef.current);
        attachLocalVideo();

        room.remoteParticipants.forEach((participant) => {
          participant.trackPublications.forEach((publication) => {
            if (publication.track) {
              attachRemoteTrack(publication.track, participant);
            }
          });
        });

        refreshParticipants();
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
    };
  }, [
    attachLocalVideo,
    attachRemoteTrack,
    displayName,
    refreshParticipants,
    roomId,
  ]);

  const setMicrophoneEnabled = useCallback(async (enabled: boolean) => {
    await roomRef.current?.localParticipant.setMicrophoneEnabled(enabled);
  }, []);

  const setCameraEnabled = useCallback(
    async (enabled: boolean) => {
      await roomRef.current?.localParticipant.setCameraEnabled(enabled);
      if (enabled) {
        window.setTimeout(attachLocalVideo, 0);
      }
    },
    [attachLocalVideo],
  );

  return {
    status,
    error,
    participantCount,
    remoteName,
    setMicrophoneEnabled,
    setCameraEnabled,
  };
}
