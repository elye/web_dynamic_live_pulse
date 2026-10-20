import { Check } from "lucide-react";
import { useRef } from "react";
import { useFitFont } from "../../hooks/useFitFont";
import { canCompete, type PollDisplay, type Question } from "../../model";

/**
 * Poll/quiz bars. With `fit`, every option shares one font size: as large as
 * the space allows for short options, smaller only when the text is long.
 */
export function PollResults({
  question,
  results,
  total,
  reveal,
  fit,
  hideCounts = false,
  display,
}: {
  question: Question;
  results: { text: string; count: number }[];
  total: number;
  reveal: boolean;
  fit: boolean;
  /** Show the options only, without percentages, bars, or counts. */
  hideCounts?: boolean;
  display?: PollDisplay;
}) {
  const displayMode = hideCounts ? "list" : (display ?? "list");
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  useFitFont(
    box,
    list,
    11,
    38,
    results.map((item) => item.text).join("\n") +
      (reveal ? "r" : "") +
      (hideCounts ? "h" : "") +
      fit,
  );
  const sorted = results
    .map((item, index) => ({ ...item, index }))
    .sort((first, second) => second.count - first.count);
  const chart =
    displayMode === "pie" || displayMode === "stacked" || displayMode === "bar";

  if (chart) {
    const totalCount = results.reduce((sum, item) => sum + item.count, 0);
    const chartPercentage = (count: number) =>
      totalCount ? (count / totalCount) * 100 : 0;
    const tallest = Math.max(1, ...results.map((item) => item.count));
    const barHeight = (count: number) => (count / tallest) * 100;
    let offset = 0;
    const pieLabels = sorted.map((item) => {
      const share = chartPercentage(item.count);
      const angle = (offset + share / 2) * 3.6 - 90;
      offset += share;
      // Keep external labels on a stable side; sorting the pie must not make a
      // label jump sides as response values change.
      const side = share < 12 ? "left" : "inside";
      return { ...item, share, angle, side };
    });
    const externalLabels = pieLabels.filter((item) => item.share < 12);
    const labelRank = (item: (typeof pieLabels)[number]) =>
      externalLabels
        .filter((other) => other.side === item.side)
        .sort((first, second) => first.share - second.share)
        .findIndex((other) => other.index === item.index);
    offset = 0;
    const gradient = sorted
      .map((item) => {
        const start = offset;
        offset += chartPercentage(item.count);
        return `var(--poll-color-${item.index % 4}) ${start}% ${offset}%`;
      })
      .join(", ");
    return (
      <div
        className={`poll-chart poll-chart-${displayMode}`}
        aria-label="Poll response chart"
      >
        {displayMode === "pie" && (
          <div className="poll-pie-wrap">
            <div
              className="poll-pie"
              style={{ background: `conic-gradient(${gradient})` }}
            >
              {pieLabels.map((item) => {
                const radians = (item.angle * Math.PI) / 180;
                const inside = item.share >= 12;
                const distance = inside ? 31 : 0;
                const side = item.side === "left" ? "left" : "right";
                return (
                  <span
                    key={item.index}
                    className={`poll-pie-label ${inside ? "inside" : `outside ${side}`}`}
                    style={{
                      left: inside ? `${50 + Math.cos(radians) * distance}%` : `${side === "right" ? 100 : 0}%`,
                      top: inside
                        ? `${50 + Math.sin(radians) * distance}%`
                        : `${18 + labelRank(item) * 22}%`,
                    }}
                  >
                    {!inside && <em className={`poll-pie-color color-${item.index % 4}`} aria-hidden="true" />}
                    <strong>{Math.round(item.share)}%</strong>
                    <small>{item.text}</small>
                  </span>
                );
              })}
            </div>
          </div>
        )}
        {displayMode === "stacked" && (
          <>
            <div className="poll-stacked" aria-label="Stacked horizontal poll responses">
              {sorted.map((item) => {
                const share = chartPercentage(item.count);
                const canFitLegend =
                  share >= Math.max(16, Math.min(48, item.text.length * 2));
                return (
                  <div
                    key={item.index}
                    className={`poll-segment color-${item.index % 4}`}
                    style={{ width: `${share}%` }}
                    title={`${item.text}: ${Math.round(share)}%`}
                  >
                    {share >= 7 && (
                      <span className={canFitLegend ? "poll-segment-label" : "poll-segment-percent-only"}>
                        <strong>{Math.round(share)}%</strong>
                        {canFitLegend && <small>{item.text}</small>}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="poll-thin-labels">
              {sorted.filter((item) => chartPercentage(item.count) < Math.max(16, Math.min(48, item.text.length * 2))).map((item) => (
                <div key={item.index}>
                  <i className={`poll-legend-color color-${item.index % 4}`} />
                  <strong>{Math.round(chartPercentage(item.count))}%</strong>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </>
        )}
        {displayMode === "bar" && (
          <div className="poll-vertical-bars">
            {sorted.map((item) => (
              <div className="poll-vertical-column" key={item.index}>
                <div className="poll-vertical-track">
                  <div
                    className={`bar-fill color-${item.index % 4}`}
                    style={{ height: `${barHeight(item.count)}%` }}
                  >
                    <strong>{Math.round(chartPercentage(item.count))}%</strong>
                  </div>
                </div>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const content = (
    <div
      ref={list}
      className={`poll-results ${hideCounts ? "counts-hidden" : ""} ${results.length >= 4 && question.type !== "twotruths" ? "two-col" : ""}`}
    >
      {results.map((item, index) => {
        const isAnswer =
          reveal &&
          canCompete(question.type) &&
          (question.corrects?.length
            ? question.corrects.includes(index)
            : question.correct === index);
        const hasAnswer = reveal && canCompete(question.type);
        return (
          <div
            className={`poll-row ${isAnswer ? "is-answer" : hasAnswer ? "not-answer" : ""}`}
            key={index}
          >
            <div className="poll-label">
              <span>
                <b className={`option-letter color-${index % 4}`}>
                  {String.fromCharCode(65 + index)}
                </b>
                {item.text}
                {isAnswer && (
                  <em className="answer-badge">
                    <Check size={18} strokeWidth={3} />
                    {question.type === "twotruths" ? "The lie" : "Correct"}
                  </em>
                )}
              </span>
              {!hideCounts && (
                <strong>
                  {total ? Math.round((item.count / total) * 100) : 0}%
                </strong>
              )}
            </div>
            {!hideCounts && (
              <>
                <div className="bar-track">
                  <div
                    className={`bar-fill color-${index % 4}`}
                    style={{
                      width: `${total ? (item.count / total) * 100 : 0}%`,
                    }}
                  />
                </div>
                <small>{item.count} responses</small>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
  return fit ? (
    <div className="poll-fit" ref={box}>
      {content}
    </div>
  ) : (
    content
  );
}
