import { type Answer } from "../../live";
import { type Question } from "../../model";
import { inputOf } from "../../questions/ui/inputRegistry";
import { describeAnswer } from "./describeAnswer";

/** Shows the player's own submitted answer so they can see what they sent. */
export function MyAnswer({
  question,
  answer,
}: {
  question: Question;
  answer: Answer | undefined;
}) {
  const text = describeAnswer(question, answer);
  if (!text) return null;
  const many =
    Array.isArray(answer) &&
    inputOf(question.type).listsAnswers === true &&
    answer.length > 1;
  return (
    <div className="my-answer">
      <small>{many ? "Your answers" : "Your answer"}</small>
      <strong>{text}</strong>
    </div>
  );
}
