import { FileText } from "lucide-react";
import { useParticipant } from "../ParticipantContext";

export function SlideView() {
  const { question, room } = useParticipant();
  if (!room || !question) return null;
  return (
    <div className="participant-slide">
      <FileText size={38} />
      <p>{question.description}</p>
      <p className="waiting-note">
        Sit back for a moment. Your host will continue shortly.
      </p>
    </div>
  );
}
