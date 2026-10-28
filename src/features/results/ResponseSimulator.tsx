import {
  MessageCircle,
  MessageCircleQuestion,
  Shuffle,
  Users,
} from "lucide-react";
import { useState } from "react";
import { IconButton } from "../../components/IconButton";
import { Modal } from "../../components/Modal";
import type { Question } from "../../model";
import { traitsOf } from "../../questions";
import { ResultsVisual } from "./ResultsVisual";

const openResponses = [
  "More time to explore ideas together.",
  "The energy we bring as a team is fantastic.",
  "I would like to hear more customer stories.",
  "A clearer view of our next milestone.",
  "More opportunities to share what is working.",
  "Time to celebrate the progress we have made.",
  "A chance to try the new ideas from today.",
  "More space for focused collaboration.",
  "A simple way to keep this momentum going.",
  "More cross-team learning sessions.",
  "A shared place for useful resources.",
  "Time to reflect before we choose the next step.",
];

const questions = [
  "What is next for the roadmap?",
  "Can we see this in action?",
  "How will we measure success?",
  "What support is available after launch?",
  "Which team owns the next step?",
  "Can we explore another example?",
  "When will this be ready to try?",
  "How does this connect to our goals?",
  "What should we do first?",
  "Where can I find the supporting materials?",
  "What risks should we plan for?",
  "Can we revisit this decision later?",
];

export function ResponseSimulator({
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
  const isQna = traitsOf(question.type).upvotes;
  const results = Array.from({ length: count }, (_, index) => ({
    id: String(index + 1),
    text: (isQna ? questions : openResponses)[(index + generation) % 12],
    count: isQna ? Math.max(1, 8 - Math.floor(index / 3)) : 1,
  }));
  const simulatedQuestion: Question = { ...question, results };

  return (
    <Modal
      title={isQna ? "Q&A simulator" : "Open response simulator"}
      onClose={onClose}
      wide
    >
      <div className="response-simulator">
        <div className="simulation-controls">
          <label className="simulation-count">
            {isQna ? "Questions" : "Responses"} <output>{count}</output>
            <input
              aria-label={isQna ? "Questions" : "Responses"}
              type="range"
              min={7}
              max={300}
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
          aria-label={isQna ? "Simulated Q&A" : "Simulated open responses"}
        >
          <span className="eyebrow">SIMULATED RESPONSES</span>
          <h3>{question.title}</h3>
          <ResultsVisual question={simulatedQuestion} />
          <div className="simulation-summary">
            <span>
              {isQna ? (
                <MessageCircleQuestion size={15} />
              ) : (
                <MessageCircle size={15} />
              )}
              {count} {isQna ? "questions" : "responses"}
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
