"use client";

import { RefObject, useEffect, useState } from "react";

type CameraStatus = "idle" | "starting" | "ready" | "blocked" | "unavailable";

export function useCameraPreview(
  videoRef: RefObject<HTMLVideoElement | null>,
  enabled: boolean,
) {
  const [status, setStatus] = useState<CameraStatus>("idle");

  useEffect(() => {
    const videoElement = videoRef.current;

    if (!enabled) {
      if (videoElement?.srcObject instanceof MediaStream) {
        videoElement.srcObject.getTracks().forEach((track) => track.stop());
        videoElement.srcObject = null;
      }
      return;
    }

    let stream: MediaStream | null = null;
    let cancelled = false;

    async function startPreview() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unavailable");
        return;
      }

      setStatus("starting");

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: "user",
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        if (videoElement) {
          videoElement.srcObject = stream;
          await videoElement.play();
        }

        setStatus("ready");
      } catch {
        setStatus("blocked");
      }
    }

    startPreview();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());

      if (videoElement?.srcObject instanceof MediaStream) {
        videoElement.srcObject.getTracks().forEach((track) => track.stop());
        videoElement.srcObject = null;
      }
    };
  }, [enabled, videoRef]);

  if (!enabled) {
    return "idle";
  }

  return status;
}
