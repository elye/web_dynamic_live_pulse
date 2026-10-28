import { defineQuestion, parseText, pick } from "../../platform/define.ts";
import { sentences } from "../../platform/samples.ts";

export const qna = defineQuestion({
  kind: "qna",
  label: "Q&A",
  hint: "Participants submit and upvote live questions",
  tagline: "Submit and upvote live questions.",
  traits: { revealMode: false, resultsAlwaysVisible: true, upvotes: true },
  options: null,
  create: () => ({
    title: "Ask us anything",
    options: [],
    correct: null,
  }),
  answer: {
    parse: (_question, value) => parseText(value, 280),
    describe: (_question, answer) => String(answer),
    simulate: (_question, random) => pick(random, sentences),
  },
  results: {
    aggregate: (_question, values, env) =>
      (values as string[])
        .map((text, index) => ({
          id: env.tokens[index],
          text,
          count: env.upvotes(env.tokens[index]),
        }))
        .sort((first, second) => second.count - first.count),
  },
  prompt: {
    purpose:
      "Open Q&A. Participants submit questions and upvote others. Always live.",
    rules: "options: []. correct: null. No revealMode.",
  },
});
