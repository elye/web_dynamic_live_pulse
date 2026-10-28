import type { VoteColor } from "../../platform/types.ts";

/** Many options: at most this many options, each at most this many characters. */
export const manyOptionsMax = 30;
export const manyOptionLength = 30;
export const manyOptionsMaxColumns = 6;
export const manyOptionsMaxRows = 5;
export const othersLabel = "Others";
/** Many options: at most this many vote-count colour steps. */
export const voteColorsMax = 8;
/** Red with no votes, green from the first vote. */
export const defaultVoteColors: VoteColor[] = [
  { min: 0, color: "#e5484d" },
  { min: 1, color: "#30a46c" },
];

/** Every box of a many options question: the options, then "Others" when enabled. */
export function manyOptionLabels(question: {
  options: string[];
  others?: boolean;
}) {
  return question.others
    ? [...question.options, othersLabel]
    : [...question.options];
}

/**
 * Box layout for `count` options: at most 6 columns by 5 rows, with columns
 * equal to rows or one more. A short last row is centred by the renderer.
 */
export function manyOptionsGrid(count: number) {
  const total = Math.max(1, count);
  for (let rows = 1; rows <= manyOptionsMaxRows; rows++) {
    if (rows * rows >= total) return { columns: rows, rows };
    if (rows * (rows + 1) >= total) return { columns: rows + 1, rows };
  }
  return { columns: manyOptionsMaxColumns, rows: manyOptionsMaxRows };
}

/** The colour of the step with the highest `min` that the vote count reaches. */
export function voteColor(colors: VoteColor[] | undefined, count: number) {
  const steps = colors?.length ? colors : defaultVoteColors;
  let match = steps[0];
  for (const step of steps)
    if (count >= step.min && step.min >= match.min) match = step;
  return match.color;
}

/** Steps must start at 0 votes, rise strictly, and use #rrggbb colours. */
export function isVoteColorsValid(colors: unknown): colors is VoteColor[] {
  return (
    Array.isArray(colors) &&
    colors.length >= 1 &&
    colors.length <= voteColorsMax &&
    colors.every(
      (step, index) =>
        !!step &&
        typeof step === "object" &&
        Number.isInteger(step.min) &&
        step.min >= 0 &&
        step.min <= 100000 &&
        typeof step.color === "string" &&
        /^#[0-9a-fA-F]{6}$/.test(step.color) &&
        (index === 0 ? step.min === 0 : step.min > colors[index - 1].min),
    )
  );
}
