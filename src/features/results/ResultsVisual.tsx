import {
  ArrowUp,
  Grid2x2,
  MessageCircle,
  MessageCircleQuestion,
  Radio,
} from "lucide-react";
import WordCloud from "../../WordCloud";
import { optionKinds, samples } from "../../constants/kinds";
import { type Question } from "../../model";
import { GridAxisLabel } from "./GridAxisLabel";
import { PollResults } from "./PollResults";
import { SliderResults } from "./SliderResults";

export function ResultsVisual({
  question,
  preview = false,
  reveal = false,
  fit = false,
  concealed = false,
  onUpvote,
  upvotedIds,
}: {
  question: Question;
  preview?: boolean;
  reveal?: boolean;
  fit?: boolean;
  /** Show only the frame (axes / range), without any responses. */
  concealed?: boolean;
  onUpvote?: (entrantId: string) => void;
  upvotedIds?: Set<string>;
}) {
  if (question.type === "slide") return null;
  const results: { text: string; count: number; id?: string }[] = preview
    ? question.type === "cloud"
      ? samples
      : question.type === "text"
        ? [
            { text: "More time to explore ideas together.", count: 1 },
            { text: "The energy we bring as a team!", count: 1 },
          ]
        : question.type === "slider"
          ? [
              { text: "Average: 6.4", count: 5 },
              { text: String(question.sliderMin ?? 0), count: 1 },
              { text: "4", count: 2 },
              { text: "7", count: 1 },
              { text: String(question.sliderMax ?? 10), count: 1 },
            ]
          : question.type === "qna"
            ? [
                { id: "1", text: "What’s next for the roadmap?", count: 6 },
                { id: "2", text: "Can we see this in action?", count: 3 },
              ]
            : question.type === "grid2x2"
              ? [
                  { text: "Average: 24,18", count: 5 },
                  { text: "40,30", count: 1 },
                  { text: "10,20", count: 1 },
                  { text: "-20,10", count: 1 },
                  { text: "30,-5", count: 1 },
                  { text: "60,35", count: 1 },
                ]
              : question.options.map((text, index) => ({
                  text,
                  count: [8, 14, 6, 10, 4, 5][index],
                }))
    : question.results?.length || !optionKinds.includes(question.type)
      ? question.results || []
      : question.options.map((text) => ({ text, count: 0 }));
  const total =
    question.type === "qna"
      ? results.length
      : (question.type === "poll" || question.type === "quiz") &&
          question.multiple &&
          !preview
        ? (question.responses ?? 0)
        : results.reduce((sum, item) => sum + item.count, 0);
  if (concealed && question.type === "slider")
    return (
      <SliderResults
        min={question.sliderMin ?? 0}
        max={question.sliderMax ?? 10}
        summary={`${question.sliderMin ?? 0} to ${question.sliderMax ?? 10}`}
        values={[]}
        average={null}
      />
    );
  if (
    !preview &&
    !total &&
    !optionKinds.includes(question.type) &&
    question.type !== "slider" &&
    !(concealed && question.type === "grid2x2")
  )
    return (
      <div className="response-empty">
        <span className="empty-rings">
          <Radio size={34} />
        </span>
        <h3>Waiting for the first spark</h3>
        <p>
          {question.type === "cloud"
            ? "Your audience’s words will appear here."
            : question.type === "qna"
              ? "Submitted questions will appear here as they arrive."
              : "Responses will appear here as they arrive."}
        </p>
      </div>
    );
  if (question.type === "cloud") return <WordCloud results={results} />;
  if (question.type === "points100") {
    const allocated = [...results].sort(
      (first, second) => second.count - first.count,
    );
    const peak = Math.max(1, ...allocated.map((item) => item.count));
    return (
      <div className="ranking-results">
        {allocated.map((item, index) => (
          <div className="ranking-row" key={item.text}>
            <div className="poll-label">
              <span>
                <b className={`option-letter color-${index % 4}`}>
                  {String.fromCharCode(65 + index)}
                </b>
                {item.text}
              </span>
              <strong>{item.count} pts</strong>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill ranking-fill"
                style={{ width: `${(item.count / peak) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (question.type === "ranking") {
    const ranked = [...results].sort(
      (first, second) => second.count - first.count,
    );
    return (
      <div className="ranking-results">
        {ranked.map((item, index) => (
          <div className="ranking-row" key={item.text}>
            <div className="poll-label">
              <span>
                <span className="ranking-position">{index + 1}</span>
                {item.text}
              </span>
              <strong>{item.count} pts</strong>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill ranking-fill"
                style={{
                  width: `${ranked[0].count ? (item.count / ranked[0].count) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (question.type === "slider") {
    const [summary, ...distribution] = results;
    const average = Number(summary?.text.replace("Average: ", ""));
    return (
      <SliderResults
        min={question.sliderMin ?? 0}
        max={question.sliderMax ?? 10}
        summary={
          summary?.count
            ? summary.text
            : `${question.sliderMin ?? 0} to ${question.sliderMax ?? 10}`
        }
        values={distribution
          .map((item) => ({ value: Number(item.text), count: item.count }))
          .filter((item) => Number.isFinite(item.value))}
        average={summary?.count && Number.isFinite(average) ? average : null}
      />
    );
  }
  if (question.type === "grid2x2") {
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
  if (question.type === "text")
    return (
      <div className="text-results">
        {results.map((item, index) => (
          <div className="text-response" key={`${item.text}-${index}`}>
            <MessageCircle size={18} />
            <p>{item.text}</p>
            {item.count > 1 && <span>×{item.count}</span>}
          </div>
        ))}
      </div>
    );
  if (question.type === "qna")
    return (
      <div className="qna-results">
        {[...results]
          .sort((first, second) => second.count - first.count)
          .map((item, index) => (
            <div className="qna-entry" key={item.id ?? index}>
              <MessageCircleQuestion size={18} />
              <p>{item.text}</p>
              {onUpvote && item.id ? (
                <button
                  type="button"
                  className={`qna-upvote ${upvotedIds?.has(item.id) ? "chosen" : ""}`}
                  onClick={() => onUpvote(item.id!)}
                  aria-pressed={upvotedIds?.has(item.id)}
                >
                  <ArrowUp size={14} />
                  {item.count}
                </button>
              ) : (
                <span className="qna-upvote-count">
                  <ArrowUp size={14} />
                  {item.count}
                </span>
              )}
            </div>
          ))}
      </div>
    );
  return (
    <PollResults
      question={question}
      results={results}
      total={total}
      reveal={reveal}
      fit={fit}
    />
  );
}
