import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import { useFitFont } from "../../../hooks/useFitFont";
import { type Question } from "../../registry";

type Share = { count: number; total: number };

/**
 * Two columns of boxes. With shares, an arrow runs from each item on the left to its
 * partner on the right and says how many players matched it. Without them the right
 * column is only shown in the order players see it.
 */
export function MatchDiagram({
  question,
  right,
  shares,
  fit,
}: {
  question: Question;
  right: string[];
  shares?: Share[];
  fit: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  useFitFont(
    box,
    list,
    11,
    28,
    question.options.join("\n") + right.join("\n") + String(fit),
  );
  const content = (
    <div ref={list} className="poll-results match-diagram">
      {question.options.map((item, index) => {
        const share = shares?.[index];
        const percent = share?.total
          ? Math.round((share.count / share.total) * 100)
          : 0;
        return (
          <div className="match-row" key={index}>
            <div className="match-box">
              <span>{item}</span>
            </div>
            <div className={`match-link ${share ? "" : "is-plain"}`}>
              {share && (
                <>
                  <strong>{percent}%</strong>
                  <span className="match-link-line">
                    <span className="match-link-track">
                      <span style={{ width: `${percent}%` }} />
                    </span>
                    <ArrowRight size="1.3em" strokeWidth={3} />
                  </span>
                </>
              )}
            </div>
            <div className="match-box match-box-right">
              <span>{right[index]}</span>
            </div>
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
