import { BarChart3 } from "lucide-react";
import { ResultsVisual } from "../../results/ResultsVisual";
import { MyAnswer } from "../MyAnswer";
import { useParticipant } from "../ParticipantContext";

export function LiveResultsReveal() {
  const { answers, question, hasSubmitted, room } = useParticipant();
  if (!room || !question) return null;
  return (
    <div className="participant-reveal">
      <span className="result-tag">
        <BarChart3 size={15} />
        Live results
      </span>
      <ResultsVisual question={question} />
      {hasSubmitted && (
        <MyAnswer question={question} answer={answers[question.id]} />
      )}
      <p className="waiting-note">
        {hasSubmitted ? "Your voice is in. " : ""}Results update as people
        answer.
      </p>
    </div>
  );
}
