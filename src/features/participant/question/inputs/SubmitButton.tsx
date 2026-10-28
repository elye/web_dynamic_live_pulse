import { LoaderCircle, Send } from "lucide-react";
import { useParticipant } from "../../ParticipantContext";

export function SubmitButton() {
  const { busy, connected, ready, question, room } = useParticipant();
  if (!room || !question) return null;
  return (
    <button
      className="button primary full"
      disabled={busy || !connected || !ready}
    >
      {busy ? (
        <LoaderCircle className="spin" size={18} />
      ) : (
        <>
          <Send size={17} />
          Send response
        </>
      )}
    </button>
  );
}
