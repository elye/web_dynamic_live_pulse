import { Percent } from "lucide-react";
import { useParticipant } from "../../ParticipantContext";

export function PointsInput() {
  const { question, pointsAllocation, pointsAllocated, setPointsFor, room } =
    useParticipant();
  if (!room || !question) return null;
  return (
    <div className="points100-input">
      <div
        className={`points100-total ${pointsAllocated === 100 ? "complete" : ""}`}
      >
        <Percent size={16} />
        <strong>{pointsAllocated}</strong>
        <span>/ 100 allocated</span>
      </div>
      <div className="points100-list">
        {question.options.map((option, index) => (
          <div className="points100-row" key={index}>
            <span className={`option-letter color-${index % 4}`}>
              {String.fromCharCode(65 + index)}
            </span>
            <span className="points100-label">{option}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={pointsAllocation[index] ?? 0}
              onChange={(event) =>
                setPointsFor(index, Number(event.target.value))
              }
            />
            <input
              type="number"
              className="points100-value"
              min={0}
              max={100 - (pointsAllocated - (pointsAllocation[index] ?? 0))}
              inputMode="numeric"
              value={pointsAllocation[index] ?? 0}
              onChange={(event) =>
                setPointsFor(
                  index,
                  Math.max(0, Math.min(100, Number(event.target.value) || 0)),
                )
              }
            />
          </div>
        ))}
      </div>
      {pointsAllocated !== 100 && (
        <small className="field-error">
          Allocate exactly 100 points to submit.
        </small>
      )}
    </div>
  );
}
