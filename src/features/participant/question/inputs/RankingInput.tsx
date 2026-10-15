import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { IconButton } from "../../../../components/IconButton";
import { useParticipant } from "../../ParticipantContext";

export function RankingInput() {
  const { question, rankingOrder, moveRankItem, room } = useParticipant();
  if (!room || !question) return null;
  return (
    <div
      className="rank-list"
      aria-label="Drag to reorder, most important first"
    >
      {rankingOrder.map((optionIndex, position) => (
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
              disabled={position === rankingOrder.length - 1}
              onClick={() => moveRankItem(position, position + 1)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
