import { useCallback, useEffect, useRef, useState } from "react";
import { readStored, store } from "../../model";

export const MUSIC_FADE_MS = 2000;
const DEFAULT_VOLUME = 70;
const TICK_MS = 50;

type Track = { url: string; name: string };

/**
 * Background music for hosted sessions. Tracks live in memory only (object
 * URLs), keyed by session id. The music fades in when a room goes live and
 * fades out when it ends; `volume` is the level it fades to and from.
 */
export function useSessionMusic({
  sessionId,
  isLive,
  notify,
}: {
  sessionId: string;
  isLive: boolean;
  notify: (message: string) => void;
}) {
  const [tracks, setTracks] = useState<Record<string, Track>>({});
  const [volume, setVolumeState] = useState(() => {
    const saved = readStored<number>("pulse:musicVolume", DEFAULT_VOLUME);
    return typeof saved === "number" && saved >= 0 && saved <= 100
      ? saved
      : DEFAULT_VOLUME;
  });
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // The track that is sounding now; it outlives the live room while fading out.
  const playing = useRef<string | null>(null);
  const level = useRef(0);
  const timer = useRef(0);
  const gain = useRef(0);
  const track = tracks[sessionId];
  const trackUrl = track?.url;

  useEffect(() => {
    gain.current = muted ? 0 : volume / 100;
  }, [volume, muted]);

  // A detached-from-React element, kept in the DOM so it can be inspected in tests.
  useEffect(() => {
    const audio = document.createElement("audio");
    audio.loop = true;
    audio.hidden = true;
    audio.dataset.testid = "session-music";
    document.body.append(audio);
    audioRef.current = audio;
    return () => {
      window.clearInterval(timer.current);
      audio.pause();
      audio.remove();
      audioRef.current = null;
    };
  }, []);

  const apply = useCallback(() => {
    const audio = audioRef.current;
    if (audio)
      audio.volume = Math.min(1, Math.max(0, level.current * gain.current));
  }, []);

  useEffect(() => {
    apply();
  }, [apply, volume, muted]);

  const fadeTo = useCallback(
    (target: number, done?: () => void) => {
      window.clearInterval(timer.current);
      const audio = audioRef.current;
      if (!audio) return;
      if (target > 0 && audio.paused) {
        audio.play().catch(() => {
          // Autoplay was refused; start on the next click or key press.
          const retry = () => {
            window.removeEventListener("pointerdown", retry);
            window.removeEventListener("keydown", retry);
            void audio.play().catch(() => {});
          };
          window.addEventListener("pointerdown", retry);
          window.addEventListener("keydown", retry);
        });
      }
      const from = level.current;
      const duration = MUSIC_FADE_MS * Math.abs(target - from);
      const started = performance.now();
      const step = () => {
        const progress =
          duration > 0
            ? Math.min(1, (performance.now() - started) / duration)
            : 1;
        level.current = from + (target - from) * progress;
        apply();
        if (progress >= 1) {
          window.clearInterval(timer.current);
          done?.();
        }
      };
      step();
      if (level.current !== target)
        timer.current = window.setInterval(step, TICK_MS);
    },
    [apply],
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isLive) {
      if (!playing.current && trackUrl) {
        audio.src = trackUrl;
        playing.current = trackUrl;
      }
      if (playing.current) fadeTo(1);
    } else if (playing.current) {
      fadeTo(0, () => {
        audio.pause();
        audio.currentTime = 0;
        playing.current = null;
      });
    }
  }, [isLive, trackUrl, fadeTo]);

  function setTrack(file: File | null) {
    if (file && !file.type.startsWith("audio/")) {
      notify("Choose an audio file.");
      return;
    }
    setTracks((current) => {
      const previous = current[sessionId];
      if (previous && previous.url !== playing.current)
        URL.revokeObjectURL(previous.url);
      const { [sessionId]: _removed, ...rest } = current;
      return file
        ? {
            ...rest,
            [sessionId]: { url: URL.createObjectURL(file), name: file.name },
          }
        : rest;
    });
  }

  function setVolume(value: number) {
    setVolumeState(value);
    store("pulse:musicVolume", value);
    if (value > 0) setMuted(false);
  }

  return {
    track,
    setTrack,
    volume,
    setVolume,
    muted,
    setMuted,
  };
}

export type SessionMusic = ReturnType<typeof useSessionMusic>;
