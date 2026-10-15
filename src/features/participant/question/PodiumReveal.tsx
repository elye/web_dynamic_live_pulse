import { Podium } from "../../scoring/Podium";
import { useParticipant } from "../ParticipantContext";

export function PodiumReveal() {
  const { room, question } = useParticipant();
  if (!room || !question) return null;
  return (
    <div className="participant-reveal">
      <Podium room={room} />
      <p className="waiting-note">
        Thanks for playing. Your host will wrap up shortly.
      </p>
    </div>
  );
}
