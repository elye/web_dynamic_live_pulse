import { Check } from "lucide-react";
import { useRef } from "react";
import { useFitFont } from "../../hooks/useFitFont";
import { canCompete, type Question } from "../../model";

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
}: {
  question: Question;
  results: { text: string; count: number }[];
  total: number;
  reveal: boolean;
  fit: boolean;
  /** Show the options only, without percentages, bars, or counts. */
  hideCounts?: boolean;
}) {
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
