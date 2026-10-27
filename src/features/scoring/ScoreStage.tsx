import { Sparkles, Trophy } from "lucide-react";
import { JoinQr } from "../../components/JoinQr";
import { type Room } from "../../model";
import { Leaderboard } from "./Leaderboard";
import { Podium } from "./Podium";

/** The host's full-slide ranking of the top 10 players, the suspense slide, or the final podium. */
export function ScoreStage({
  room,
  theme,
  showQr = false,
  onReveal,
  disabled = false,
}: {
  room: Room;
  theme: string;
  showQr?: boolean;
  /** Reveals the final podium; the host clicks this from the suspense slide. */
  onReveal?: () => void;
  disabled?: boolean;
}) {
  return (
    <section
      className={`question-stage score-stage theme-${theme} ${showQr ? "has-qr" : ""}`}
    >
      {showQr && <JoinQr code={room.code} nameless={room.nameless} />}
      {room.suspense && !room.podium ? (
        <div className="suspense-stage">
          <Sparkles size={56} className="suspense-icon" />
          <h2>The final results are in…</h2>
          <p>Take a breath, then reveal the winners.</p>
          <button
            className="button primary suspense-button"
            onClick={onReveal}
            disabled={disabled || !onReveal}
          >
            <Trophy size={32} />
            Reveal the final podium
          </button>
        </div>
      ) : room.podium ? (
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
