import { defineQuestion, shuffled } from "../../platform/define.ts";
import type { QuestionRecord } from "../../platform/types.ts";

const itemLetter = (index: number) => String.fromCharCode(65 + index);

function parsePermutation(value: unknown, length: number, field: string) {
  if (
    !Array.isArray(value) ||
    value.length !== length ||
    value.some(
      (index) => !Number.isInteger(index) || index < 0 || index >= length,
    ) ||
    new Set(value).size !== length
  )
    throw new Error(`${field} must contain every item index exactly once.`);
  return value as number[];
}

/**
 * An order for the second list in which no item sits beside its own partner, so a player
 * who touches nothing scores nothing.
 */
export function jumble(length: number, random: () => number = Math.random) {
  const order = shuffled(random, [...Array(length).keys()]);
  for (let index = 0; index < length; index++)
    if (order[index] === index) {
      const other = (index + 1) % length;
      [order[index], order[other]] = [order[other], order[index]];
    }
  return order;
}

/**
 * For each position in the list a player sees, which pair it belongs to. A running room
 * hides this from players until the reveal; before a room exists the list is in pair order.
 */
const pairAt = (question: QuestionRecord) =>
  question.matchShuffle ?? question.options.map((_, index) => index);

/** List B in the order players see it. */
export const shownMatchOptions = (question: QuestionRecord) => {
  const items = question.matchOptions ?? [];
  return question.matchShuffle
    ? question.matchShuffle.map((pair) => items[pair])
    : items;
};

/** Whether the player placed the right item beside row `row` of list A. */
const isRightPair = (
  question: QuestionRecord,
  answer: readonly number[],
  row: number,
) => pairAt(question)[answer[row]] === row;

export const matchedPairs = (question: QuestionRecord, answer: unknown) =>
  Array.isArray(answer)
    ? answer.filter((_, row) => isRightPair(question, answer, row)).length
    : 0;

export const match = defineQuestion({
  kind: "match",
  label: "Match",
  hint: "Put the second list in the order that matches the first",
  tagline: "Drag the right-hand items beside their matches.",
  traits: {
    scored: true,
    defaultRevealMode: "onDone",
    optionsVisibleWhenHidden: true,
    playerAuthorable: false,
  },
  options: {
    min: 2,
    max: 6,
    maxLength: 100,
    message: "Add 2 to 6 nonempty items, up to 100 characters each.",
  },
  settings: ["matchOptions", "matchShuffle"],
  parse(raw, { options, canonical }) {
    if (raw.correct !== undefined && raw.correct !== null)
      throw new Error("Match questions must set correct to null.");
    if (
      !Array.isArray(raw.matchOptions) ||
      raw.matchOptions.length !== options.length ||
      raw.matchOptions.some(
        (item) =>
          typeof item !== "string" || !item.trim() || item.trim().length > 100,
      )
    )
      throw new Error(
        "Add one nonempty match (up to 100 characters) for every item in the first list.",
      );
    const matchOptions = (raw.matchOptions as string[]).map((item) =>
      item.trim(),
    );
    if (
      new Set(matchOptions.map((item) => item.toLowerCase())).size !==
      matchOptions.length
    )
      throw new Error("Every match must be different.");
    return {
      correct: null,
      matchOptions,
      // Only a running room needs the jumble; imports and exports hold the pairs alone.
      ...(canonical ? { matchShuffle: jumble(options.length) } : {}),
    };
  },
  serialize: ({ matchOptions }) => ({ matchOptions }),
  conceal: (question) => ({
    matchOptions: shownMatchOptions(question),
    matchShuffle: undefined,
  }),
  create: () => ({
    title: "Match each person with their birth year",
    options: [
      "Ada Lovelace",
      "Albert Einstein",
      "Katherine Johnson",
      "Alan Turing",
    ],
    matchOptions: ["1815", "1879", "1918", "1912"],
    correct: null,
  }),
  answer: {
    // The answer lists, for each item of list A, the position in the list the player saw
    // of the item they placed beside it.
    parse(question, value) {
      return parsePermutation(value, question.options.length, "Your matches");
    },
    describe(question, answer) {
      const shown = shownMatchOptions(question);
      return (answer as number[])
        .map(
          (position, row) =>
            `${itemLetter(row)}. ${question.options[row]} → ${shown[position] ?? ""}`,
        )
        .join(" · ");
    },
    simulate: (question, random) =>
      shuffled(random, [...Array(question.options.length).keys()]),
  },
  results: {
    // Each row of list A, with how many players placed its own partner beside it.
    aggregate(question, values) {
      const counts = new Array<number>(question.options.length).fill(0);
      for (const value of values as number[][])
        value.forEach((_, row) => {
          if (isRightPair(question, value, row)) counts[row]++;
        });
      return question.options.map((text, row) => ({
        text,
        count: counts[row],
      }));
    },
  },
  score(question, answer) {
    return question.options.length
      ? matchedPairs(question, answer) / question.options.length
      : 0;
  },
  author: { toRaw: (input) => ({ options: input.options }) },
  prompt: {
    purpose:
      "A scored matching quiz: you supply the pairs, the app jumbles the second list, and each participant drags it into place beside the first. Use it for people and years, animals and types, or countries and capitals.",
    rules:
      'options: 2-6 strings for list A (max 100 characters each). matchOptions: exactly the same number of different, nonempty strings for list B (max 100 characters each), where matchOptions[i] is the correct partner of options[i]; keep them in matching order, the app jumbles list B for players. correct: null. Optional competitive (boolean, default true) and showRanking (boolean, default true); revealMode is "live" or "onDone" (default "onDone"). Points are proportional to the number of pairs a participant gets right.',
  },
});
