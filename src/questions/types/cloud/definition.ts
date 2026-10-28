import { defineQuestion, parseText, tallyText } from "../../platform/define.ts";

const words = [
  "Teamwork",
  "Growth",
  "Coffee",
  "Focus",
  "Trust",
  "Ideas",
  "Energy",
  "Clarity",
  "Fun",
  "Learning",
  "Support",
  "Balance",
  "Momentum",
  "Curious",
  "Ownership",
  "Creativity",
  "Feedback",
  "Listening",
  "Goals",
  "Pace",
];

export const cloud = defineQuestion({
  kind: "cloud",
  label: "Word cloud",
  hint: "One word, a whole room of perspectives",
  tagline: "A single word from every voice.",
  options: null,
  settings: ["maxSubmissions"],
  create: () => ({
    title: "How are you feeling in one word?",
    options: [],
    correct: null,
    maxSubmissions: 1,
  }),
  parse({ maxSubmissions }) {
    if (
      maxSubmissions !== undefined &&
      (typeof maxSubmissions !== "number" ||
        !Number.isInteger(maxSubmissions) ||
        maxSubmissions < 1 ||
        maxSubmissions > 5)
    )
      throw new Error(
        "Word clouds can allow 1 to 5 submissions per participant.",
      );
    return { maxSubmissions: maxSubmissions ?? 1 };
  },
  serialize: ({ maxSubmissions }) => ({ maxSubmissions: maxSubmissions ?? 1 }),
  answer: {
    parse: (_question, value) => parseText(value, 30),
    describe: (_question, answer) =>
      Array.isArray(answer) ? answer.join(" · ") : String(answer),
    // Earlier words are picked more often, giving a realistic frequency curve.
    simulate: (_question, random) =>
      words[Math.floor(random() ** 2 * words.length)],
    limit: (question) => question.maxSubmissions ?? 1,
  },
  results: {
    aggregate: (_question, values) =>
      tallyText(values, (value) => value.toLocaleLowerCase()),
  },
  prompt: {
    purpose:
      "Word cloud. Each participant submits one or more short words or phrases; the most common words grow largest.",
    rules:
      "options: []. correct: null. Title is an open prompt answerable in one or two words. Optional maxSubmissions: integer 1-5, default 1, controls how many times each participant may contribute.",
  },
});
