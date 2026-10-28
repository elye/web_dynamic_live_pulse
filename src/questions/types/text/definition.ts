import {
  defineQuestion,
  parseText,
  pick,
  tallyText,
} from "../../platform/define.ts";
import { sentences } from "../../platform/samples.ts";

export const text = defineQuestion({
  kind: "text",
  label: "Open response",
  hint: "Give every thought a little room",
  tagline: "Space for the longer answer.",
  options: null,
  create: () => ({
    title: "What is one thing we could do better?",
    options: [],
    correct: null,
  }),
  answer: {
    parse: (_question, value) => parseText(value, 280),
    describe: (_question, answer) => String(answer),
    simulate: (_question, random) => pick(random, sentences),
  },
  results: { aggregate: (_question, values) => tallyText(values) },
  prompt: {
    purpose:
      "Open response. Participants type a free-text answer that the host reads.",
    rules: "options: []. correct: null.",
  },
});
