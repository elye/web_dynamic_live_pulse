import { Leaderboard } from "../../scoring/Leaderboard";
import { useParticipant } from "../ParticipantContext";

export function RankingReveal() {
  const { room, question } = useParticipant();
  if (!room || !question) return null;
  return (
    <div className="participant-reveal">
      <div className="participant-ranking">
        <Leaderboard room={room} compact title="Top 10 players" maxFont={16} />
      </div>
      <p className="waiting-note">
        Your host will continue to the next question shortly.
      </p>
    </div>
  );
}
