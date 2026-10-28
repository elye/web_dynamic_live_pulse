import { defineQuestion } from "../../platform/define.ts";

export const slider = defineQuestion({
  kind: "slider",
  label: "Slider",
  hint: "Estimate a numeric value on a sliding scale",
  tagline: "Slide to estimate a number.",
  traits: { frameVisibleWhenHidden: true },
  options: null,
  create: () => ({
    title: "How many hours a day do you spend in meetings?",
    options: [],
    correct: null,
    sliderMin: 0,
    sliderMax: 10,
    sliderStep: 1,
  }),
  parse({ sliderMin, sliderMax, sliderStep }) {
    if (
      typeof sliderMin !== "number" ||
      typeof sliderMax !== "number" ||
      typeof sliderStep !== "number" ||
      !Number.isFinite(sliderMin) ||
      !Number.isFinite(sliderMax) ||
      !Number.isFinite(sliderStep) ||
      sliderStep <= 0 ||
      sliderMax <= sliderMin ||
      (sliderMax - sliderMin) / sliderStep > 1000
    )
      throw new Error("Add a valid slider minimum, maximum, and step.");
    return { sliderMin, sliderMax, sliderStep };
  },
  serialize: ({ sliderMin, sliderMax, sliderStep }) => ({
    sliderMin,
    sliderMax,
    sliderStep,
  }),
  answer: {
    parse(question, value) {
      const { sliderMin: min, sliderMax: max, sliderStep: step } = question;
      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < min! ||
        value > max! ||
        Math.abs(Math.round((value - min!) / step!) * step! + min! - value) >
          1e-9
      )
        throw new Error("Choose a value on the slider.");
      return value;
    },
    describe: (_question, answer) => String(answer),
    simulate(question, random) {
      const { sliderMin: min, sliderMax: max, sliderStep: step } = question;
      const steps = Math.max(0, Math.floor((max! - min!) / step!));
      const position = Math.round(((random() + random()) / 2) * steps);
      return Number((min! + position * step!).toFixed(8));
    },
  },
  results: {
    aggregate(_question, values) {
      const numbers = values as number[];
      const average = numbers.length
        ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length
        : 0;
      const distribution = new Map<number, number>();
      for (const value of numbers)
        distribution.set(value, (distribution.get(value) || 0) + 1);
      return [
        {
          text: `Average: ${Math.round(average * 100) / 100}`,
          count: numbers.length,
        },
        ...[...distribution]
          .map(([value, count]) => ({ text: String(value), count }))
          .sort((first, second) => Number(first.text) - Number(second.text)),
      ];
    },
  },
  author: {
    toRaw: (input) => ({
      sliderMin: input.sliderMin,
      sliderMax: input.sliderMax,
      sliderStep: input.sliderStep,
    }),
  },
  prompt: {
    purpose:
      "Participants choose a number on a slider; results show the distribution and average.",
    rules:
      "options: []. correct: null. sliderMin, sliderMax, sliderStep are REQUIRED numbers: sliderMax > sliderMin, sliderStep > 0, and (sliderMax - sliderMin) / sliderStep <= 1000.",
  },
});
