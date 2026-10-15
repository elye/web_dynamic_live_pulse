import { Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { onHeart } from "../live";
import { reactionOptions } from "../constants/reactions";

type FloatingHeart = {
  id: number;
  kind: string;
  left: number;
  drift: number;
  size: number;
  duration: number;
};

/** Hearts sent by participants pop up, float toward the top, and slowly fade away. */
export function HeartLayer() {
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const nextId = useRef(0);
  useEffect(
    () =>
      onHeart((payload) => {
        const id = nextId.current++;
        setHearts((current) => [
          ...current.slice(-39),
          {
            id,
            kind: payload?.kind ?? "heart",
            left: 6 + Math.random() * 88,
            drift: Math.round(Math.random() * 90 - 45),
            size: 24 + Math.round(Math.random() * 22),
            duration: 3.6 + Math.random() * 1.6,
          },
        ]);
      }),
    [],
  );
  return (
    <div className="heart-layer" aria-hidden="true">
      {hearts.map((heart) => (
        <span
          key={heart.id}
          className="floating-heart"
          style={{
            left: `${heart.left}%`,
            animationDuration: `${heart.duration}s`,
            ["--heart-drift" as string]: `${heart.drift}px`,
          }}
          onAnimationEnd={() =>
            setHearts((current) =>
              current.filter((item) => item.id !== heart.id),
            )
          }
        >
          {heart.kind === "heart" ? (
            <Heart size={heart.size} fill="currentColor" strokeWidth={1.5} />
          ) : (
            <span
              className="floating-emoji"
              style={{ fontSize: `${heart.size}px` }}
            >
              {reactionOptions.find((item) => item.kind === heart.kind)?.emoji}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
