import type { CSSProperties } from "react";
import {
  manyOptionsGrid,
  voteColor,
  type Question,
  type VoteColor,
} from "../../model";

/** White or dark ink, whichever reads better on the given #rrggbb colour. */
function inkFor(color: string) {
  const channel = (offset: number) => parseInt(color.slice(offset, offset + 2), 16) / 255;
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return luminance > 0.6 ? "#1f2d27" : "#ffffff";
}

/**
 * Many options results: one box per option (plus "Others"), laid out in at most
 * 6 columns by 5 rows. A short last row is centred. Each box shows its vote
 * count and takes its colour from the vote-count steps of the question.
 */
export function ManyOptionsResults({
  results,
  voteColors,
  fit = false,
  hideCounts = false,
}: {
  question?: Question;
  results: { text: string; count: number }[];
  voteColors?: VoteColor[];
  /** Fill the available stage space instead of flowing at natural height. */
  fit?: boolean;
  /** Show the options only, without counts or vote colours. */
  hideCounts?: boolean;
}) {
  const { columns, rows } = manyOptionsGrid(results.length);
  return (
    <div
      className={`many-results ${fit ? "many-fit" : "many-flow"}`}
      aria-label="Many options responses"
    >
      <div
        className="many-grid"
        style={
          {
            "--cols-wide": columns,
            "--rows": rows,
          } as CSSProperties
        }
      >
        {results.map((item, index) => {
          const background = hideCounts ? "#ffffffcc" : voteColor(voteColors, item.count);
          return (
            <div
              className={`many-box ${hideCounts ? "many-box-plain" : ""}`}
              key={index}
              style={{
                background,
                color: hideCounts ? "#2c4a3c" : inkFor(background),
              }}
              title={hideCounts ? item.text : `${item.text}: ${item.count}`}
            >
              {!hideCounts && <b className="many-count">{item.count}</b>}
              <span className="many-label">{item.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
