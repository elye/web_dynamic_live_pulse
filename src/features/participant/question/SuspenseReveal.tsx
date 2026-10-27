import { Sparkles } from "lucide-react";
import { useParticipant } from "../ParticipantContext";

export function SuspenseReveal() {
  const { room, question } = useParticipant();
  if (!room || !question) return null;
  return (
    <div className="participant-reveal suspense-stage">
      <Sparkles size={48} className="suspense-icon" />
      <h2>The final results are in…</h2>
      <p>Your host is about to reveal the winners.</p>
    </div>
  );
}
