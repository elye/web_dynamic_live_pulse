import { Trophy } from "lucide-react";
import { useRef } from "react";
import { useFitFont } from "../../hooks/useFitFont";
import { type Room } from "../../model";

export function Leaderboard({
  room,
  compact = false,
  title = "The leaderboard",
  maxFont = 64,
}: {
  room: Room;
  compact?: boolean;
  title?: string;
  maxFont?: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  useFitFont(
    box,
    list,
    11,
    maxFont,
    JSON.stringify(room.leaderboard) + (compact ? "c" : "") + maxFont,
  );
  if (compact)
    return (
      <section className="leaderboard compact">
        <Trophy size={28} />
        <h2>{title}</h2>
        <div className="leader-fit" ref={box}>
          <div className="leader-list" ref={list}>
            {room.leaderboard.map((entry, index) => (
              <div className="leader-row" key={index}>
                <b>{index + 1}</b>
                <span>{entry.name}</span>
                <strong>{entry.score.toLocaleString()} pts</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  return (
    <section className="leaderboard">
      <Trophy size={32} />
      <h2>{title}</h2>
      {room.leaderboard.map((entry, index) => (
        <div className="leader-row" key={index}>
          <b>{index + 1}</b>
          <span>{entry.name}</span>
          <strong>{entry.score.toLocaleString()} pts</strong>
        </div>
      ))}
    </section>
  );
}
