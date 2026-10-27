import { Podium } from "../../scoring/Podium";
import { useParticipant } from "../ParticipantContext";

export function PodiumReveal() {
  const { room, question } = useParticipant();
  if (!room || !question) return null;
  return (
    <div className="participant-reveal">
      <Podium room={room} />
      {room.me && room.me.rank > 3 && (
        <p className="participant-you-note">
          You finished #{room.me.rank} of {room.me.total} with{" "}
          {room.me.score.toLocaleString()} pts
        </p>
      )}
      <p className="waiting-note">
        Thanks for playing. Your host will wrap up shortly.
      </p>
    </div>
  );
}
