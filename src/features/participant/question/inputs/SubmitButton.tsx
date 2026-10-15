import { LoaderCircle, Send } from "lucide-react";
import { useParticipant } from "../../ParticipantContext";

export function SubmitButton() {
  const {
    busy,
    connected,
    question,
    currentAnswer,
    pointsAllocated,
    gridPoint,
    isMultiple,
    selectedOptions,
    room,
  } = useParticipant();
  if (!room || !question) return null;
  return (
    <button
      className="button primary full"
      disabled={
        busy ||
        !connected ||
        (question.type === "points100"
          ? pointsAllocated !== 100
          : question.type === "grid2x2"
            ? !gridPoint
            : isMultiple
              ? selectedOptions.length === 0
              : !["ranking", "slider"].includes(question.type) &&
                (currentAnswer === "" ||
                  (typeof currentAnswer === "string" && !currentAnswer.trim())))
      }
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
