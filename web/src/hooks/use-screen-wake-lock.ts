"use client";

import { useEffect, useRef } from "react";

export function useScreenWakeLock(enabled: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled || !("wakeLock" in navigator)) {
      return;
    }

    let cancelled = false;

    const requestWakeLock = async () => {
      if (document.visibilityState !== "visible" || wakeLockRef.current) {
        return;
      }

      try {
        const wakeLock = await navigator.wakeLock.request("screen");

        if (cancelled) {
          await wakeLock.release().catch(() => undefined);
          return;
        }

        wakeLockRef.current = wakeLock;
        wakeLock.addEventListener("release", () => {
          if (wakeLockRef.current === wakeLock) {
            wakeLockRef.current = null;
          }
        });
      } catch {
        wakeLockRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void requestWakeLock();
      }
    };

    void requestWakeLock();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      const wakeLock = wakeLockRef.current;
      wakeLockRef.current = null;
      void wakeLock?.release().catch(() => undefined);
    };
  }, [enabled]);
}
