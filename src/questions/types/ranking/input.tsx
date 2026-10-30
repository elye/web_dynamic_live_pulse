import { GripVertical } from "lucide-react";
import { useParticipant } from "../../../features/participant/ParticipantContext";
import { useSwapDrag } from "../../../hooks/useSwapDrag";
import { type Question } from "../../registry";
import { type AnswerValue, type QuestionInput } from "../../ui/input";

const rankingOrder = (question: Question, touched: AnswerValue) =>
  Array.isArray(touched) ? touched : question.options.map((_, index) => index);

function RankingInput() {
  const { question, currentAnswer, setAnswer, setAnswerQuestion, room } =
    useParticipant();
  const order = question ? rankingOrder(question, currentAnswer) : [];
  const swap = (first: number, second: number) => {
    if (!question) return;
    const next = [...order];
    [next[first], next[second]] = [next[second], next[first]];
    setAnswer(next);
    setAnswerQuestion(question.id);
  };
  const { item } = useSwapDrag(swap);
  if (!room || !question) return null;
  return (
    <div
      className="rank-list"
      aria-label="Drag an item onto another to swap them, most important first"
    >
      {order.map((optionIndex, position) => {
        const { className, ...props } = item(position);
        return (
          <div
            className={`rank-item swap-tone-${optionIndex % 8} ${className}`}
            key={optionIndex}
            aria-label={`${position + 1}. ${question.options[optionIndex]}`}
            {...props}
          >
            <GripVertical size={16} />
            <span className="rank-position">{position + 1}</span>
            <span>{question.options[optionIndex]}</span>
          </div>
        );
      })}
    </div>
  );
}

export const input: QuestionInput = {
  resolve: rankingOrder,
  isReady: () => true,
  Input: RankingInput,
};
