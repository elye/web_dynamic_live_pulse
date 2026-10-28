import {
  OptionsConcealed,
  optionPreviewRows,
} from "../../../features/results/pollFamily";
import { type QuestionResults } from "../../ui/results";

export const results: QuestionResults = {
  Results: ({ results }) => {
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
  },
  Concealed: OptionsConcealed,
  previewRows: optionPreviewRows,
};
