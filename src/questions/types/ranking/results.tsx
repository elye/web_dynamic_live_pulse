import {
  OptionsConcealed,
  optionPreviewRows,
} from "../../../features/results/pollFamily";
import { useFlip } from "../../../hooks/useFlip";
import { type QuestionResults } from "../../ui/results";

function RankingResults({
  results,
}: {
  results: { text: string; count: number }[];
}) {
  const ranked = [...results].sort(
    (first, second) => second.count - first.count,
  );
  const list = useFlip<HTMLDivElement>(
    ranked.map((item) => item.text).join("\n"),
  );
  return (
    <div className="ranking-results" ref={list}>
      {ranked.map((item, index) => (
        <div className="ranking-row" key={item.text} data-flip={item.text}>
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

export const results: QuestionResults = {
  Results: RankingResults,
  Concealed: OptionsConcealed,
  previewRows: optionPreviewRows,
};
