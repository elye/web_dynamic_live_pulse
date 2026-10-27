import { Shuffle, SlidersHorizontal, Users } from "lucide-react";
import { useState } from "react";
import { IconButton } from "../../components/IconButton";
import { Modal } from "../../components/Modal";
import { type Question } from "../../model";
import { ResultsVisual } from "./ResultsVisual";

export function SliderSimulator({
  question,
  theme,
  onClose,
}: {
  question: Question;
  theme: string;
  onClose: () => void;
}) {
  const [participants, setParticipants] = useState(100);
  const [generation, setGeneration] = useState(0);
  const min = question.sliderMin ?? 0;
  const max = question.sliderMax ?? 10;
  const step = question.sliderStep ?? 1;
  const stepCount = Math.max(1, Math.floor((max - min) / step));
  const randomAt = (index: number) => {
    const value = Math.sin((generation + 1) * 1000 + index * 12.9898) * 43758.5453;
    return value - Math.floor(value);
  };
  const distribution = new Map<number, number>();
  let total = 0;
  for (let index = 0; index < participants; index++) {
    const highBiasedPosition = 1 - Math.pow(randomAt(index), 2.2);
    const value = Number(
      Math.min(
        max,
        min + Math.round(highBiasedPosition * stepCount) * step,
      ).toFixed(8),
    );
    distribution.set(value, (distribution.get(value) ?? 0) + 1);
    total += value;
  }
  const average = total / participants;
  const simulatedQuestion: Question = {
    ...question,
    responses: participants,
    results: [
      { text: `Average: ${average.toFixed(1)}`, count: participants },
      ...[...distribution]
        .sort(([first], [second]) => first - second)
        .map(([value, count]) => ({ text: String(value), count })),
    ],
  };

  return (
    <Modal title="Slider simulator" onClose={onClose} wide>
      <div className="slider-simulator">
        <div className="simulation-controls">
          <label className="simulation-count">
            Participants <output>{participants}</output>
            <input
              aria-label="Participants"
              type="range"
              min={1}
              max={300}
              step={1}
              value={participants}
              onChange={(event) => setParticipants(Number(event.target.value))}
            />
          </label>
          <IconButton
            icon={Shuffle}
            label="Regenerate sample"
            onClick={() => setGeneration((current) => current + 1)}
          />
        </div>
        <section
          className={`simulation-stage theme-${theme}`}
          aria-label="Simulated slider results"
        >
          <span className="eyebrow">SIMULATED RESPONSES</span>
          <h3>{question.title}</h3>
          <ResultsVisual question={simulatedQuestion} />
          <div className="simulation-summary">
            <span>
              <SlidersHorizontal size={15} />
              Average {average.toFixed(1)}
            </span>
            <span>
              <Users size={15} />
              {participants} sample participants
            </span>
          </div>
        </section>
      </div>
    </Modal>
  );
}