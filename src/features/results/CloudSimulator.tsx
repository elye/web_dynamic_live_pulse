import { Cloud, Shuffle, Users } from "lucide-react";
import { useState } from "react";
import WordCloud from "../../WordCloud";
import { IconButton } from "../../components/IconButton";
import { Modal } from "../../components/Modal";
import { type Question } from "../../model";
import { SAMPLE_LIMIT, sampleEmoji, sampleWords } from "./cloudSamples";

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
  const [showWords, setShowWords] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);
  const pool =
    showWords && showEmoji
      ? sampleWords.flatMap((word, index) => [word, sampleEmoji[index]])
      : showEmoji
        ? sampleEmoji
        : sampleWords;
  // Each participant submits one word, so there can't be more words than participants.
  const shown = Math.min(count, participants);
  const weights = Array.from({ length: shown }, (_, index) =>
    distribution === "equal" ? 1 : Math.pow(1 - index / shown, 3),
  );
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  const spare = participants - shown;
  const exactCounts = weights.map((weight) => (weight / weightTotal) * spare);
  const counts = exactCounts.map(Math.floor);
  const remaining = spare - counts.reduce((sum, value) => sum + value, 0);
  exactCounts
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((first, second) => second.fraction - first.fraction)
    .slice(0, remaining)
    .forEach(({ index }) => {
      counts[index] += 1;
    });
  const results = counts.map((extra, index) => ({
    text: pool[(index + generation * 13) % pool.length],
    count: extra + 1,
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
              max={SAMPLE_LIMIT}
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
              max={1000}
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
          <div
            className="simulation-kinds"
            role="group"
            aria-labelledby="cloud-kinds"
          >
            <span id="cloud-kinds">Show</span>
            <div className="simulation-kinds-options">
              <label>
                <input
                  type="checkbox"
                  checked={showWords}
                  disabled={showWords && !showEmoji}
                  onChange={(event) => setShowWords(event.target.checked)}
                />
                Words
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={showEmoji}
                  disabled={showEmoji && !showWords}
                  onChange={(event) => setShowEmoji(event.target.checked)}
                />
                Emoji
              </label>
            </div>
          </div>
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
          <WordCloud results={results} limit={SAMPLE_LIMIT} />
          <div className="simulation-summary">
            <span>
              <Cloud size={15} />
              {results.length} distinct{" "}
              {results.length === 1 ? "word" : "words"}
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
