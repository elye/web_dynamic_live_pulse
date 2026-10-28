import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { IconButton } from "../../../components/IconButton";
import { useParticipant } from "../../../features/participant/ParticipantContext";
import { type Question } from "../../registry";
import { type AnswerValue, type QuestionInput } from "../../ui/input";

const rankingOrder = (question: Question, touched: AnswerValue) =>
  Array.isArray(touched) ? touched : question.options.map((_, index) => index);

function RankingInput() {
  const { question, currentAnswer, setAnswer, setAnswerQuestion, room } =
    useParticipant();
  if (!room || !question) return null;
  const order = rankingOrder(question, currentAnswer);
  const moveRankItem = (from: number, to: number) => {
    const next = [...order];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setAnswer(next);
    setAnswerQuestion(question.id);
  };
  return (
    <div
      className="rank-list"
      aria-label="Drag to reorder, most important first"
    >
      {order.map((optionIndex, position) => (
        <div
          className="rank-item"
          key={optionIndex}
          draggable
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", String(position));
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const from = Number(event.dataTransfer.getData("text/plain"));
            moveRankItem(from, position);
          }}
        >
          <GripVertical size={16} />
          <span className="rank-position">{position + 1}</span>
          <span>{question.options[optionIndex]}</span>
          <div className="rank-move-buttons">
            <IconButton
              icon={ArrowUp}
              label={`Move ${question.options[optionIndex]} up`}
              disabled={position === 0}
              onClick={() => moveRankItem(position, position - 1)}
            />
            <IconButton
              icon={ArrowDown}
              label={`Move ${question.options[optionIndex]} down`}
              disabled={position === order.length - 1}
              onClick={() => moveRankItem(position, position + 1)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export const input: QuestionInput = {
  resolve: rankingOrder,
  isReady: () => true,
  Input: RankingInput,
};
