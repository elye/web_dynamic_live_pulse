import { BarChart3, Shuffle, Users } from "lucide-react";
import { useState } from "react";
import { IconButton } from "../../components/IconButton";
import { Modal } from "../../components/Modal";
import type { PollDisplay, Question } from "../../model";
import { ResultsVisual } from "./ResultsVisual";

export function PollSimulator({
  question,
  theme,
  onClose,
}: {
  question: Question;
  theme: string;
  onClose: () => void;
}) {
  const [responses, setResponses] = useState(100);
  const [display, setDisplay] = useState<PollDisplay>(
    question.pollDisplay ?? "list",
  );
  const [generation, setGeneration] = useState(0);
  const changingOptions = Math.max(1, question.options.length - 1);
  const initialWinner = generation % changingOptions;
  const challenger = (initialWinner + 1) % changingOptions;
  const progress = (responses - 1) / 299;
  const remainingActive = Math.max(0, changingOptions - 2);
  const weights = question.options.map((_, index) => {
    if (index === question.options.length - 1) return 0.02;
    if (index === initialWinner) return 0.62 - progress * 0.47;
    if (index === challenger) return 0.18 + progress * 0.47;
    return remainingActive ? 0.18 / remainingActive : 0;
  });
  const exactCounts = weights.map((weight) => responses * weight);
  const counts = exactCounts.map(Math.floor);
  let remaining = responses - counts.reduce((sum, count) => sum + count, 0);
  exactCounts
    .map((count, index) => ({ index, fraction: count - Math.floor(count) }))
    .sort((first, second) => second.fraction - first.fraction)
    .slice(0, remaining)
    .forEach(({ index }) => {
      counts[index] += 1;
    });
  const simulatedResults = question.options.map((text, index) => ({
    text,
    count: counts[index],
  }));
  const simulatedQuestion: Question = {
    ...question,
    pollDisplay: display,
    responses,
    results: simulatedResults,
  };

  return (
    <Modal title="Multiple choice simulator" onClose={onClose} wide>
      <div className="poll-simulator">
        <div className="simulation-controls">
          <label className="simulation-count">
            Responses <output>{responses}</output>
            <input
              aria-label="Responses"
              type="range"
              min={1}
              max={300}
              step={1}
              value={responses}
              onChange={(event) => setResponses(Number(event.target.value))}
            />
          </label>
          <label>
            Display type
            <select
              aria-label="Display type"
              value={display}
              onChange={(event) =>
                setDisplay(event.target.value as PollDisplay)
              }
            >
              <option value="list">Current response display</option>
              <option value="pie">Pie chart</option>
              <option value="stacked">Single stack horizontal bar</option>
              <option value="bar">Vertical bars</option>
            </select>
          </label>
          <IconButton
            icon={Shuffle}
            label="Regenerate sample"
            onClick={() => setGeneration((current) => current + 1)}
          />
        </div>
        <section className={`simulation-stage theme-${theme}`} aria-label="Simulated multiple choice results">
          <span className="eyebrow">SIMULATED RESPONSES</span>
          <h3>{question.title}</h3>
          <ResultsVisual question={simulatedQuestion} />
          <div className="simulation-summary">
            <span><BarChart3 size={15} />{display === "list" ? "Response list" : display === "pie" ? "Pie chart" : display === "stacked" ? "Stacked horizontal bar" : "Vertical bars"}</span>
            <span><Users size={15} />{responses} sample players</span>
          </div>
        </section>
      </div>
    </Modal>
  );
}
