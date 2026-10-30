import { BarChart3, Check } from "lucide-react";
import { canCompete } from "../../../model";
import { inputOf } from "../../../questions/ui/inputRegistry";
import { ResultsVisual } from "../../results/ResultsVisual";
import { MyAnswer } from "../MyAnswer";
import { useParticipant } from "../ParticipantContext";
import { Verdict } from "../Verdict";

export function ResultsReveal() {
  const { live, answers, question, hasSubmitted, room } = useParticipant();
  if (!room || !question) return null;
  const input = inputOf(question.type);
  const CorrectAnswer = input.CorrectAnswer;
  const hasCorrectAnswer = question.correct !== null || !!CorrectAnswer;
  return (
    <div className="participant-reveal">
      <span className="result-tag">
        <BarChart3 size={15} />
        The results are in
      </span>
      {hasSubmitted && (
        <MyAnswer question={question} answer={answers[question.id]} />
      )}
      <ResultsVisual question={question} reveal />
      {canCompete(question.type) &&
        hasCorrectAnswer &&
        !(question.author && question.author === live.credentials()?.name) && (
          <Verdict
            question={question}
            answer={answers[question.id]}
            answered={hasSubmitted}
          />
        )}
      {canCompete(question.type) &&
        (CorrectAnswer ? (
          <CorrectAnswer question={question} />
        ) : (
          <div className="correct-answer">
            <Check size={20} />
            {input.correctAnswerLabel
              ? input.correctAnswerLabel
              : question.corrects?.length
                ? "Correct answers"
                : "Correct answer"}
            :{" "}
            {question.corrects?.length
              ? question.corrects
                  .map((index) => question.options[index])
                  .join(", ")
              : question.options[question.correct!]}
          </div>
        ))}
      <p className="waiting-note">
        A moment to take it in. Your host will continue shortly.
      </p>
    </div>
  );
}
