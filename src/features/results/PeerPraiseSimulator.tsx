import { MessageCircle, Shuffle, Users } from "lucide-react";
import { useState } from "react";
import { IconButton } from "../../components/IconButton";
import { Modal } from "../../components/Modal";
import { ResultsVisual } from "./ResultsVisual";
import type { Question } from "../../model";

const names = [
  "Alex",
  "Sam",
  "Jordan",
  "Taylor",
  "Morgan",
  "Riley",
  "Casey",
  "Jamie",
  "Drew",
  "Avery",
  "Quinn",
  "Robin",
];
const messages = [
  "You make everyone feel welcome.",
  "Your creativity inspires the team.",
  "You bring thoughtful energy to every conversation.",
  "You help the team move forward with confidence.",
  "Your positive attitude makes collaboration easier.",
  "You listen carefully and make space for every voice.",
  "You turn challenges into opportunities to learn.",
  "Your kindness makes a real difference.",
  "You explain complex ideas clearly and patiently.",
  "You celebrate other people’s progress generously.",
  "You bring calm focus when things get busy.",
  "You make working together genuinely enjoyable.",
];

export function PeerPraiseSimulator({
  question,
  theme,
  onClose,
}: {
  question: Question;
  theme: string;
  onClose: () => void;
}) {
  const [count, setCount] = useState(10);
  const [generation, setGeneration] = useState(0);
  const results = Array.from({ length: count }, (_, index) => ({
    text: messages[(index + generation) % messages.length],
    target: names[(index * 3 + generation) % names.length],
    count: 1,
  }));
  const simulatedQuestion: Question = {
    ...question,
    type: "peerpraise",
    results,
  };

  return (
    <Modal title="Peer praise simulator" onClose={onClose} wide>
      <div className="peer-praise-simulator">
        <div className="simulation-controls">
          <label className="simulation-count">
            Praise entries <output>{count}</output>
            <input
              aria-label="Praise entries"
              type="range"
              min={7}
              max={30}
              step={1}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
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
          aria-label="Simulated peer praise"
        >
          <span className="eyebrow">SIMULATED RESPONSES</span>
          <h3>{question.title}</h3>
          <ResultsVisual question={simulatedQuestion} />
          <div className="simulation-summary">
            <span>
              <MessageCircle size={15} />
              {count} praise entries
            </span>
            <span>
              <Users size={15} />
              {count} sample players
            </span>
          </div>
        </section>
      </div>
    </Modal>
  );
}
