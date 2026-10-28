import { GridAxisLabel } from "../../../features/results/GridAxisLabel";
import { useParticipant } from "../../../features/participant/ParticipantContext";
import { type AnswerValue, type QuestionInput } from "../../ui/input";

const gridPoint = (touched: AnswerValue) =>
  touched && typeof touched === "object" && !Array.isArray(touched)
    ? touched
    : null;

const clamp = (value: number) =>
  Math.max(-100, Math.min(100, Math.round(value)));

function GridInput() {
  const { question, currentAnswer, setAnswer, setAnswerQuestion, room } =
    useParticipant();
  if (!room || !question) return null;
  const point = gridPoint(currentAnswer);
  const setGridPoint = (x: number, y: number) => {
    setAnswer({ x: clamp(x), y: clamp(y) });
    setAnswerQuestion(question.id);
  };
  return (
    <div className="grid2x2-input">
      <button
        type="button"
        className="grid2x2-pad"
        aria-label="Tap to place your point on the grid"
        onClick={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          const fractionX = (event.clientX - bounds.left) / bounds.width;
          const fractionY = (event.clientY - bounds.top) / bounds.height;
          setGridPoint(fractionX * 200 - 100, -(fractionY * 200 - 100));
        }}
      >
        <GridAxisLabel side="top" text={question.options[3]} max={18} />
        <GridAxisLabel side="bottom" text={question.options[2]} max={18} />
        <GridAxisLabel side="left" text={question.options[0]} max={18} />
        <GridAxisLabel side="right" text={question.options[1]} max={18} />
        <span className="grid2x2-quadrant-h" />
        <span className="grid2x2-quadrant-v" />
        {point && (
          <span
            className="grid2x2-marker"
            style={{
              left: `${((point.x + 100) / 200) * 100}%`,
              top: `${((-point.y + 100) / 200) * 100}%`,
            }}
          />
        )}
      </button>
      <small className="grid2x2-coords">
        {point
          ? `x: ${point.x} · y: ${point.y}`
          : "Tap the grid to place your point."}
      </small>
    </div>
  );
}

export const input: QuestionInput = {
  resolve: (_question, touched) => gridPoint(touched),
  isReady: (_question, value) => !!value,
  Input: GridInput,
};
