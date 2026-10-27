import { useLayoutEffect, useRef, type CSSProperties } from "react";
import {
  manyOptionsGrid,
  voteColor,
  type Question,
  type VoteColor,
} from "../../model";

/** White or dark ink, whichever reads better on the given #rrggbb colour. */
function inkFor(color: string) {
  const channel = (offset: number) =>
    parseInt(color.slice(offset, offset + 2), 16) / 255;
  const luminance =
    0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return luminance > 0.6 ? "#1f2d27" : "#ffffff";
}

/** One box. In a fixed-height grid the label shrinks until it fits, e.g. when it wraps to two lines. */
function ManyBox({
  text,
  count,
  background,
  fit,
  hideCounts,
}: {
  text: string;
  count: number;
  background: string;
  fit: boolean;
  hideCounts: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const element = box.current;
    const span = label.current;
    if (!fit || !element || !span) return;
    // Centred flex content overflows both ends, so compare the children's heights instead of scrollHeight.
    const overflows = () => {
      const style = getComputedStyle(element);
      const gap = parseFloat(style.rowGap) || 0;
      const available =
        element.clientHeight -
        parseFloat(style.paddingTop) -
        parseFloat(style.paddingBottom);
      const content = [...element.children].reduce(
        (sum, child, index) =>
          sum + (child as HTMLElement).offsetHeight + (index ? gap : 0),
        0,
      );
      return content > available + 1;
    };
    const shrink = () => {
      let scale = 1;
      span.style.fontSize = "";
      while (overflows() && scale > 0.4) {
        scale -= 0.05;
        span.style.fontSize = `${0.9 * scale}em`;
      }
    };
    shrink();
    const observer = new ResizeObserver(shrink);
    observer.observe(element);
    return () => observer.disconnect();
  }, [fit, text, count, hideCounts]);
  return (
    <div
      ref={box}
      className={`many-box ${hideCounts ? "many-box-plain" : ""}`}
      style={{
        background,
        color: hideCounts ? "#2c4a3c" : inkFor(background),
      }}
      title={hideCounts ? text : `${text}: ${count}`}
    >
      {!hideCounts && <b className="many-count">{count}</b>}
      <span ref={label} className="many-label">
        {text}
      </span>
    </div>
  );
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
        {results.map((item, index) => (
          <ManyBox
            key={index}
            text={item.text}
            count={item.count}
            background={
              hideCounts ? "#ffffffcc" : voteColor(voteColors, item.count)
            }
            fit={fit}
            hideCounts={hideCounts}
          />
        ))}
      </div>
    </div>
  );
}
