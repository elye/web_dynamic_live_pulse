import { GridAxisLabel } from "../../../results/GridAxisLabel";
import { useParticipant } from "../../ParticipantContext";

export function GridInput() {
  const { question, gridPoint, setGridPoint, room } = useParticipant();
  if (!room || !question) return null;
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
        {gridPoint && (
          <span
            className="grid2x2-marker"
            style={{
              left: `${((gridPoint.x + 100) / 200) * 100}%`,
              top: `${((-gridPoint.y + 100) / 200) * 100}%`,
            }}
          />
        )}
      </button>
      <small className="grid2x2-coords">
        {gridPoint
          ? `x: ${gridPoint.x} · y: ${gridPoint.y}`
          : "Tap the grid to place your point."}
      </small>
    </div>
  );
}
