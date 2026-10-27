import { Trophy } from "lucide-react";
import { useRef } from "react";
import { useFitFont } from "../../hooks/useFitFont";
import { type Room } from "../../model";

type Entry = Room["leaderboard"][number];

function LeaderRow({
  rank,
  entry,
  mine = false,
}: {
  rank: number;
  entry: Entry;
  mine?: boolean;
}) {
  return (
    <div
      className={`leader-row ${mine ? "mine" : ""}`}
      aria-current={mine ? "true" : undefined}
    >
      <b>{rank}</b>
      <span>
        {entry.name}
        {mine && <em className="leader-you">You</em>}
        <span
          className="leader-name-source"
          role="img"
          aria-label={entry.generated ? "Generated name" : "Provided name"}
          title={
            entry.generated
              ? "Generated participant name"
              : "Name provided by the participant"
          }
        >
          {entry.generated ? "✨" : "👤"}
        </span>
      </span>
      <strong>{entry.score.toLocaleString()} pts</strong>
    </div>
  );
}

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
  const me = room.me ?? null;
  const myIndex = me ? me.rank - 1 : -1;
  useFitFont(
    box,
    list,
    11,
    maxFont,
    JSON.stringify(room.leaderboard) + (compact ? "c" : "") + maxFont,
  );
  // Players always see their own place above the list, even outside the top 10.
  const position = me && (
    <div className="leader-position">
      <span>Your position</span>
      <strong>#{me.rank}</strong>
      <span>
        of {me.total} · {me.score.toLocaleString()} pts
      </span>
    </div>
  );
  if (compact)
    return (
      <section className="leaderboard compact">
        <Trophy size={28} />
        <h2>{title}</h2>
        {position}
        <div className="leader-fit" ref={box}>
          <div className="leader-list" ref={list}>
            {room.leaderboard.map((entry, index) => (
              <LeaderRow
                key={index}
                rank={index + 1}
                entry={entry}
                mine={index === myIndex}
              />
            ))}
          </div>
        </div>
      </section>
    );
  return (
    <section className="leaderboard">
      <Trophy size={32} />
      <h2>{title}</h2>
      {position}
      {room.leaderboard.map((entry, index) => (
        <LeaderRow
          key={index}
          rank={index + 1}
          entry={entry}
          mine={index === myIndex}
        />
      ))}
    </section>
  );
}
