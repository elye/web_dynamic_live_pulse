import { defineQuestion } from "../../platform/define.ts";

export const slider = defineQuestion({
  kind: "slider",
  label: "Slider",
  hint: "Estimate a numeric value on a sliding scale",
  tagline: "Slide to estimate a number.",
  traits: { frameVisibleWhenHidden: true },
  options: null,
  settings: ["sliderMin", "sliderMax", "sliderStep", "sliderChoices"],
  create: () => ({
    title: "How many hours a day do you spend in meetings?",
    options: [],
    correct: null,
    sliderMin: 0,
    sliderMax: 10,
    sliderStep: 1,
  }),
  parse({ sliderMin, sliderMax, sliderStep, sliderChoices }) {
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
    if (sliderChoices !== undefined && !Array.isArray(sliderChoices))
      throw new Error("Add up to 3 valid alternative answers.");
    const choices = (sliderChoices ?? []).map((choice) =>
      typeof choice === "string" ? choice.trim() : "",
    );
    if (
      choices.length > 3 ||
      choices.some((choice) => !choice || choice.length > 80) ||
      new Set(choices.map((choice) => choice.toLocaleLowerCase())).size !==
        choices.length
    )
      throw new Error(
        "Add 1 to 3 unique alternative answers, up to 80 characters each.",
      );
    return {
      sliderMin,
      sliderMax,
      sliderStep,
      ...(choices.length ? { sliderChoices: choices } : {}),
    };
  },
  serialize: ({ sliderMin, sliderMax, sliderStep, sliderChoices }) => ({
    sliderMin,
    sliderMax,
    sliderStep,
    ...(sliderChoices?.length ? { sliderChoices } : {}),
  }),
  answer: {
    parse(question, value) {
      if (typeof value === "string" && question.sliderChoices?.includes(value))
        return value;
      const { sliderMin: min, sliderMax: max, sliderStep: step } = question;
      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < min! ||
        value > max! ||
        Math.abs(Math.round((value - min!) / step!) * step! + min! - value) >
          1e-9
      )
        throw new Error(
          "Choose a value on the slider or an alternative answer.",
        );
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
    aggregate(question, values) {
      const numbers = values.filter(
        (value): value is number => typeof value === "number",
      );
      const average = numbers.length
        ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length
        : 0;
      const distribution = new Map<number, number>();
      for (const value of numbers)
        distribution.set(value, (distribution.get(value) || 0) + 1);
      const choices = question.sliderChoices ?? [];
      return [
        {
          text: `Average: ${Math.round(average * 100) / 100}`,
          count: numbers.length,
        },
        ...[...distribution]
          .map(([value, count]) => ({ text: String(value), count }))
          .sort((first, second) => Number(first.text) - Number(second.text)),
        ...choices.map((text, index) => ({
          id: `slider-choice-${index}`,
          text,
          count: values.filter((value) => value === text).length,
        })),
      ];
    },
  },
  author: {
    toRaw: (input) => ({
      sliderMin: input.sliderMin,
      sliderMax: input.sliderMax,
      sliderStep: input.sliderStep,
      sliderChoices: input.sliderChoices,
    }),
  },
  prompt: {
    purpose:
      "Participants choose a number on a slider or an optional alternative answer; results show the distribution and average of numeric answers plus alternative-answer counts.",
    rules:
      "options: []. correct: null. sliderMin, sliderMax, sliderStep are REQUIRED numbers: sliderMax > sliderMin, sliderStep > 0, and (sliderMax - sliderMin) / sliderStep <= 1000. sliderChoices is an OPTIONAL array of 1 to 3 unique alternative answer labels, each 1 to 80 characters; omit it when unused.",
  },
});
