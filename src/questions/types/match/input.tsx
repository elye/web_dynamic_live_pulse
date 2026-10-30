import { GripVertical } from "lucide-react";
import { useParticipant } from "../../../features/participant/ParticipantContext";
import { useSwapDrag } from "../../../hooks/useSwapDrag";
import { type Question } from "../../registry";
import { type AnswerValue, type QuestionInput } from "../../ui/input";
import { shownMatchOptions } from "./definition";

/** Until the player moves something, list B stays in the order the room showed it. */
const placement = (question: Question, touched: AnswerValue) =>
  Array.isArray(touched) && touched.length === question.options.length
    ? touched
    : question.options.map((_, index) => index);

function MatchInput() {
  const { question, currentAnswer, setAnswer, setAnswerQuestion, room } =
    useParticipant();
  const order = question ? placement(question, currentAnswer) : [];
  const swap = (first: number, second: number) => {
    if (!question) return;
    const next = [...order];
    [next[first], next[second]] = [next[second], next[first]];
    setAnswer(next);
    setAnswerQuestion(question.id);
  };
  const { item: swapItem } = useSwapDrag(swap);
  if (!room || !question) return null;
  const shown = shownMatchOptions(question);
  return (
    <div
      className="match-input"
      aria-label="Drag a right-hand item onto another to swap them, so each sits beside its match"
    >
      {question.options.map((item, row) => {
        const text = shown[order[row]];
        const { className, ...props } = swapItem(row);
        return (
          <div className="match-input-row" key={row}>
            <div className="match-input-item">
              <span>{item}</span>
            </div>
            <div
              className={`match-input-answer swap-tone-${order[row] % 8} ${className}`}
              aria-label={`${item}: ${text}`}
              {...props}
            >
              <GripVertical size={16} />
              <span>{text}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** The results already draw every pair, so there is nothing more to say about the answer. */
const CorrectPairs = () => null;

export const input: QuestionInput = {
  resolve: placement,
  isReady: () => true,
  Input: MatchInput,
  CorrectAnswer: CorrectPairs,
};
