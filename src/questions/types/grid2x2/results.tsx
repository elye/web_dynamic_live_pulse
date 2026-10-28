import { Grid2x2 } from "lucide-react";
import { GridAxisLabel } from "../../../features/results/GridAxisLabel";
import { type Question, type ResultRow } from "../../index";
import { type QuestionResults } from "../../ui/results";

function GridPlot({
  question,
  results,
  concealed,
}: {
  question: Question;
  results: ResultRow[];
  concealed: boolean;
}) {
  const [summary, ...points] = results;
  const toPercent = (value: number) => ((value + 100) / 200) * 100;
  const parsePoint = (text: string) => {
    const [x, y] = text.split(",").map(Number);
    return { x: x || 0, y: y || 0 };
  };
  const average = summary
    ? parsePoint(summary.text.replace("Average: ", ""))
    : { x: 0, y: 0 };
  return (
    <div className="grid2x2-results">
      <div className="grid2x2-plot">
        <GridAxisLabel side="top" text={question.options[3]} />
        <GridAxisLabel side="bottom" text={question.options[2]} />
        <GridAxisLabel side="left" text={question.options[0]} />
        <GridAxisLabel side="right" text={question.options[1]} />
        <span className="grid2x2-quadrant-h" />
        <span className="grid2x2-quadrant-v" />
        {points.map((point, index) => {
          const { x, y } = parsePoint(point.text);
          return (
            <span
              key={index}
              className="grid2x2-dot"
              style={{
                left: `${toPercent(x)}%`,
                top: `${toPercent(-y)}%`,
              }}
            />
          );
        })}
        {points.length > 0 && (
          <span
            className="grid2x2-dot grid2x2-dot-average"
            style={{
              left: `${toPercent(average.x)}%`,
              top: `${toPercent(-average.y)}%`,
            }}
          />
        )}
      </div>
      {!concealed && (
        <div className="grid2x2-summary">
          <Grid2x2 size={18} />
          <strong>{summary?.text || "Average: 0,0"}</strong>
          <span>{points.length} responses placed</span>
        </div>
      )}
    </div>
  );
}

export const results: QuestionResults = {
  Results: ({ question, results }) => (
    <GridPlot question={question} results={results} concealed={false} />
  ),
  Concealed: ({ question, results }) => (
    <GridPlot question={question} results={results} concealed />
  ),
  previewRows: () => [
    { text: "Average: 24,18", count: 5 },
    { text: "40,30", count: 1 },
    { text: "10,20", count: 1 },
    { text: "-20,10", count: 1 },
    { text: "30,-5", count: 1 },
    { text: "60,35", count: 1 },
  ],
  emptyText: "Responses will appear here as they arrive.",
};
