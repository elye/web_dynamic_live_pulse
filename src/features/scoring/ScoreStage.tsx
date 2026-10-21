import { JoinQr } from "../../components/JoinQr";
import { type Room } from "../../model";
import { Leaderboard } from "./Leaderboard";
import { Podium } from "./Podium";

/** The host's full-slide ranking of the top 10 players, or the final podium. */
export function ScoreStage({
  room,
  theme,
  showQr = false,
}: {
  room: Room;
  theme: string;
  showQr?: boolean;
}) {
  return (
    <section
      className={`question-stage score-stage theme-${theme} ${showQr ? "has-qr" : ""}`}
    >
      {showQr && <JoinQr code={room.code} nameless={room.nameless} />}
      {room.podium ? (
        room.leaderboard.some((entry) => entry.score > 0) ? (
          <Podium room={room} />
        ) : (
          <p className="score-empty">No points were scored.</p>
        )
      ) : (
        <Leaderboard room={room} compact title="Top 10 players" />
      )}
    </section>
  );
}
