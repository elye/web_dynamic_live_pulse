import { defineQuestion } from "../../platform/define.ts";

/** Splits 100 points across `parts` options with a few favourites. */
function splitHundred(random: () => number, parts: number) {
  const weights = Array.from({ length: parts }, () => random() ** 2 + 0.05);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const points = weights.map((weight) => Math.floor((weight / total) * 100));
  points[points.indexOf(Math.max(...points))] +=
    100 - points.reduce((a, b) => a + b, 0);
  return points;
}

export const points100 = defineQuestion({
  kind: "points100",
  label: "100 Points",
  hint: "Allocate 100 points across a set of options to show priorities",
  tagline: "Divide 100 points across what matters most.",
  traits: { optionsVisibleWhenHidden: true },
  options: {
    min: 2,
    max: 6,
    maxLength: 100,
    message: "Add 2 to 6 nonempty answer options, up to 100 characters each.",
  },
  create: () => ({
    title: "Allocate 100 points across what matters most to you",
    options: ["Design", "Performance", "Reliability", "Cost"],
    correct: null,
  }),
  answer: {
    parse(question, value) {
      if (
        !Array.isArray(value) ||
        value.length !== question.options.length ||
        value.some((points) => !Number.isInteger(points) || points < 0) ||
        (value as number[]).reduce((sum, points) => sum + points, 0) !== 100
      )
        throw new Error("Allocate exactly 100 points across the options.");
      return value as number[];
    },
    describe: (question, answer) =>
      (answer as number[])
        .map((points, index) => ({ points, index }))
        .filter((item) => item.points > 0)
        .map((item) => `${question.options[item.index]}: ${item.points}`)
        .join(" · "),
    simulate: (question, random) =>
      splitHundred(random, question.options.length),
  },
  results: {
    aggregate(question, values) {
      const points = new Array<number>(question.options.length).fill(0);
      for (const value of values as number[][])
        value.forEach((allocation, index) => {
          points[index] += allocation;
        });
      return question.options
        .map((text, index) => ({ text, count: points[index] }))
        .sort((first, second) => second.count - first.count);
    },
  },
  author: { toRaw: (input) => ({ options: input.options }) },
  prompt: {
    purpose:
      "Participants distribute 100 points across the options to show priorities.",
    rules: "options: 2-6 strings (max 100 characters each). correct: null.",
  },
});
