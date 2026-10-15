import { useEffect, useState } from "react";

const confettiColors = [
  "#f2c14e",
  "#e0607e",
  "#6fb58a",
  "#6aa6d9",
  "#9b7fd1",
  "#f29d5c",
];

type ConfettiPiece = {
  left: number;
  delay: number;
  duration: number;
  color: string;
  width: number;
  spin: number;
  sway: number;
};

/** A full-screen burst of falling confetti that starts after `delay` ms and removes itself after a few seconds. */
export function Confetti({ delay = 0 }: { delay?: number }) {
  const [pieces] = useState<ConfettiPiece[]>(() =>
    Array.from({ length: 90 }, (_, index) => ({
      left: Math.random() * 100,
      delay: Math.random() * 1.6,
      duration: 3.2 + Math.random() * 2.4,
      color: confettiColors[index % confettiColors.length],
      width: 6 + Math.round(Math.random() * 7),
      spin: Math.round(Math.random() * 720 + 360),
      sway: Math.round(Math.random() * 160 - 80),
    })),
  );
  const [ready, setReady] = useState(delay === 0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const start = setTimeout(() => setReady(true), delay);
    const stop = setTimeout(() => setDone(true), delay + 7500);
    return () => {
      clearTimeout(start);
      clearTimeout(stop);
    };
  }, [delay]);
  if (done || !ready) return null;
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((piece, index) => (
        <i
          key={index}
          style={{
            left: `${piece.left}%`,
            width: piece.width,
            height: piece.width * 1.6,
            background: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            ["--confetti-spin" as string]: `${piece.spin}deg`,
            ["--confetti-sway" as string]: `${piece.sway}px`,
          }}
        />
      ))}
    </div>
  );
}
