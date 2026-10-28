import {
  OptionsConcealed,
  optionPreviewRows,
} from "../../../features/results/pollFamily";
import { type QuestionResults } from "../../ui/results";

export const results: QuestionResults = {
  Results: ({ results }) => {
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
  },
  Concealed: OptionsConcealed,
  previewRows: optionPreviewRows,
};
