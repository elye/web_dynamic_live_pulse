import { defineQuestion, shuffled } from "../../platform/define.ts";

export const ranking = defineQuestion({
  kind: "ranking",
  label: "Ranking",
  hint: "Drag to sort items from most to least important",
  tagline: "Drag to sort what matters most.",
  traits: { optionsVisibleWhenHidden: true },
  options: {
    min: 2,
    max: 6,
    maxLength: 100,
    message: "Add 2 to 6 nonempty answer options, up to 100 characters each.",
  },
  create: () => ({
    title: "Rank these from most to least important",
    options: ["Speed", "Quality", "Cost", "Communication"],
    correct: null,
  }),
  answer: {
    parse(question, value) {
      const order = question.options.map((_, index) => index);
      if (
        !Array.isArray(value) ||
        value.length !== order.length ||
        !order.every((index) => value.includes(index))
      )
        throw new Error("Rank every option exactly once.");
      return value as number[];
    },
    describe: (question, answer) =>
      (answer as number[])
        .map((index, position) => `${position + 1}. ${question.options[index]}`)
        .join(" · "),
    simulate: (question, random) =>
      shuffled(random, [...Array(question.options.length).keys()]),
  },
  results: {
    aggregate(question, values) {
      const points = new Array<number>(question.options.length).fill(0);
      for (const value of values as number[][])
        value.forEach((optionIndex, position) => {
          points[optionIndex] += question.options.length - position;
        });
      return question.options
        .map((text, index) => ({ text, count: points[index] }))
        .sort((first, second) => second.count - first.count);
    },
  },
  author: { toRaw: (input) => ({ options: input.options }) },
  prompt: {
    purpose:
      "Participants drag options into an order from most to least important.",
    rules: "options: 2-6 strings (max 100 characters each). correct: null.",
  },
});
