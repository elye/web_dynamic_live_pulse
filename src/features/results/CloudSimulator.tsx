import { Cloud, Shuffle, Users } from "lucide-react";
import { useState } from "react";
import WordCloud from "../../WordCloud";
import { IconButton } from "../../components/IconButton";
import { Modal } from "../../components/Modal";
import { type Question } from "../../model";

export function CloudSimulator({
  question,
  theme,
  onClose,
}: {
  question: Question;
  theme: string;
  onClose: () => void;
}) {
  const [count, setCount] = useState(60);
  const [participants, setParticipants] = useState(150);
  const [distribution, setDistribution] = useState("popular");
  const [generation, setGeneration] = useState(0);
  const words = [
    "excited",
    "curious",
    "inspired",
    "optimistic",
    "energized",
    "ready",
    "focused",
    "grateful",
    "creative",
    "hopeful",
    "connected",
    "calm",
    "motivated",
    "confident",
    "happy",
    "refreshed",
    "thoughtful",
    "engaged",
    "open-minded",
    "supported",
    "learning",
    "growing",
    "together",
    "proud",
    "determined",
    "playful",
    "brave",
    "balanced",
    "welcomed",
    "resilient",
    "reflective",
    "recharged",
    "ambitious",
    "inquisitive",
    "purposeful",
    "relaxed",
    "in the zone",
    "new ideas",
    "team spirit",
    "a fresh start",
    "possibility",
    "progress",
    "collaboration",
    "clarity",
    "trust",
    "momentum",
    "discovery",
    "kindness",
    "joy",
    "adventure",
    "perspective",
    "imagination",
    "belonging",
    "patience",
    "growth",
    "energy",
    "courage",
    "potential",
    "connection",
    "inspiration",
  ];
  const weights = Array.from({ length: count }, (_, index) =>
    distribution === "equal" ? 1 : Math.pow(1 - index / count, 3),
  );
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  const exactCounts = weights.map((weight) =>
    (weight / weightTotal) * participants,
  );
  const counts = exactCounts.map(Math.floor);
  const remaining = participants - counts.reduce((sum, value) => sum + value, 0);
  exactCounts
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((first, second) => second.fraction - first.fraction)
    .slice(0, remaining)
    .forEach(({ index }) => {
      counts[index] += 1;
    });
  const results = counts.map((wordCount, index) => ({
    text: words[(index + generation * 13) % words.length],
    count: wordCount,
  }));
  const responses = results.reduce((sum, word) => sum + word.count, 0);
  return (
    <Modal title="Word cloud simulator" onClose={onClose} wide>
      <div className="cloud-simulator">
        <div className="simulation-controls">
          <label className="simulation-count">
            Distinct words <output>{count}</output>
            <input
              aria-label="Distinct words"
              type="range"
              min={10}
              max={60}
              step={10}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
            />
          </label>
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
          <label>
            Frequency
            <select
              aria-label="Frequency distribution"
              value={distribution}
              onChange={(event) => setDistribution(event.target.value)}
            >
              <option value="popular">A few popular words</option>
              <option value="equal">Equal frequencies</option>
            </select>
          </label>
          <IconButton
            icon={Shuffle}
            label="Regenerate sample"
            onClick={() => setGeneration((current) => current + 1)}
          />
        </div>
        <section
          className={`simulation-stage theme-${theme}`}
          aria-label="Simulated word cloud"
        >
          <span className="eyebrow">SIMULATED RESPONSES</span>
          <h3>{question.title}</h3>
          <WordCloud results={results} />
          <div className="simulation-summary">
            <span>
              <Cloud size={15} />
              {count} distinct words
            </span>
            <span>
              <Users size={15} />
              {responses.toLocaleString()} sample participants
            </span>
          </div>
        </section>
      </div>
    </Modal>
  );
}
