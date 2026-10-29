import { useCallback, useEffect, useState } from "react";

/** Tracks and toggles browser fullscreen for the whole page. */
export function useFullscreen() {
  const supported =
    typeof document !== "undefined" && document.fullscreenEnabled === true;
  const [fullscreen, setFullscreen] = useState(
    () => typeof document !== "undefined" && !!document.fullscreenElement,
  );

  useEffect(() => {
    const sync = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const enter = useCallback(async () => {
    if (!supported || document.fullscreenElement) return;
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // The browser refused (no user gesture, policy); presentation view still works.
    }
  }, [supported]);

  const exit = useCallback(async () => {
    if (!document.fullscreenElement) return;
    try {
      await document.exitFullscreen();
    } catch {
      // Already left fullscreen.
    }
  }, []);

  const toggle = useCallback(
    () => (document.fullscreenElement ? exit() : enter()),
    [enter, exit],
  );

  return { supported, fullscreen, enter, exit, toggle };
}
