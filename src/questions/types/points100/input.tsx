import { Percent } from "lucide-react";
import { useParticipant } from "../../../features/participant/ParticipantContext";
import { type Question } from "../../registry";
import { type AnswerValue, type QuestionInput } from "../../ui/input";

const allocationOf = (question: Question, touched: AnswerValue) =>
  Array.isArray(touched) && touched.length === question.options.length
    ? touched
    : question.options.map(() => 0);

const total = (allocation: number[]) =>
  allocation.reduce((sum, points) => sum + points, 0);

function PointsInput() {
  const { question, currentAnswer, setAnswer, setAnswerQuestion, room } =
    useParticipant();
  if (!room || !question) return null;
  const pointsAllocation = allocationOf(question, currentAnswer);
  const pointsAllocated = total(pointsAllocation);
  const setPointsFor = (index: number, points: number) => {
    // The other options keep their points, so this one can only use what is left of 100.
    const remaining = 100 - (pointsAllocated - (pointsAllocation[index] ?? 0));
    const capped = Math.max(0, Math.min(remaining, Math.round(points) || 0));
    setAnswer(
      pointsAllocation.map((value, position) =>
        position === index ? capped : value,
      ),
    );
    setAnswerQuestion(question.id);
  };
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

export const input: QuestionInput = {
  resolve: allocationOf,
  isReady: (_question, value) => Array.isArray(value) && total(value) === 100,
  Input: PointsInput,
};
