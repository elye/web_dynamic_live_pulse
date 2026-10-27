import { Users } from "lucide-react";
import { useRef, useState } from "react";
import { useFitFont } from "../../hooks/useFitFont";

/** A stable pseudo-random number between -1 and 1 for a name, so the layout looks scattered but never jumps. */
function jitter(name: string) {
  let hash = 0;
  for (const character of name)
    hash = (hash * 31 + character.charCodeAt(0)) | 0;
  return ((Math.abs(hash) % 2001) - 1000) / 1000;
}

/** Joined participants, as large as the space allows and smaller as more people arrive. */
export function LobbyNames({ names, max }: { names: string[]; max: number }) {
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  // With a crowd too large to fit at the smallest size, the list scrolls instead.
  const [overflowing, setOverflowing] = useState(false);
  useFitFont(box, list, 12, max, names.join("\n"), (fits) =>
    setOverflowing(!fits),
  );
  return (
    <div
      className={`lobby-people ${overflowing ? "scrolling" : ""}`}
      aria-label="Joined participants"
      ref={box}
    >
      {names.length ? (
        <ul ref={list}>
          {names.map((name, index) => (
            <li
              key={index}
              className={`color-${index % 4}`}
              style={{ ["--jitter" as string]: jitter(name + index) }}
            >
              {name}
            </li>
          ))}
        </ul>
      ) : (
        <div className="lobby-empty">
          <Users size={32} strokeWidth={1.3} />
          <p>Waiting for everyone to arrive</p>
        </div>
      )}
    </div>
  );
}
