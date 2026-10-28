import { isIndex, shuffled, sortedUnique } from "./define.ts";
import type { QuestionRecord } from "./types.ts";

/** One option, or several when `multiple` is on. Returns the stored value. */
export function parseChoice(value: unknown, count: number, multiple: boolean) {
  if (multiple) {
    if (
      !Array.isArray(value) ||
      !value.length ||
      new Set(value).size !== value.length ||
      value.some((index) => !isIndex(index, count))
    )
      throw new Error("Choose one or more of the available options.");
    return [...(value as number[])].sort((first, second) => first - second);
  }
  if (!isIndex(value, count))
    throw new Error("Choose one of the available options.");
  return value;
}

/** An answer for load testing: earlier options are a little more popular, the right one more so. */
export function simulateChoice(question: QuestionRecord, random: () => number) {
  const options = question.options.length;
  if (question.multiple) {
    const count = 1 + Math.floor(random() * Math.min(options, 3));
    return sortedUnique(
      shuffled(random, [...Array(options).keys()]).slice(0, count),
    );
  }
  const known = question.correct;
  if (Number.isInteger(known) && random() < 0.55) return known as number;
  return Math.min(options - 1, Math.floor(random() ** 1.4 * options));
}
