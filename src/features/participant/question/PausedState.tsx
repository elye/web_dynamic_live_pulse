import { Pause } from "lucide-react";
import { useParticipant } from "../ParticipantContext";

export function PausedState() {
  const { room, question } = useParticipant();
  if (!room || !question) return null;
  return (
    <div className="submitted-state">
      <Pause size={40} />
      <h2>A little pause.</h2>
      <p>Your host has paused responses.</p>
    </div>
  );
}
