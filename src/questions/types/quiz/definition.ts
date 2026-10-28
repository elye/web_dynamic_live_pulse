import { parseChoice, simulateChoice } from "../../platform/choice.ts";
import {
  defineQuestion,
  describeLetters,
  isIndex,
  parseMultiple,
  sortedUnique,
  tallyChoices,
} from "../../platform/define.ts";

export const quiz = defineQuestion({
  kind: "quiz",
  label: "Quiz",
  hint: "A correct answer and a little competition",
  tagline: "A little friendly competition.",
  traits: {
    scored: true,
    defaultRevealMode: "onDone",
    optionsVisibleWhenHidden: true,
  },
  options: {
    min: 2,
    max: 6,
    maxLength: 100,
    message: "Add 2 to 6 nonempty answer options, up to 100 characters each.",
  },
  settings: ["multiple"],
  create: () => ({
    title: "Which planet has the most moons?",
    options: ["Jupiter", "Saturn", "Neptune", "Mars"],
    correct: 1,
    multiple: false,
  }),
  parse({ multiple, corrects }, { options }) {
    if (!parseMultiple(multiple)) return { multiple: false };
    if (
      !Array.isArray(corrects) ||
      !corrects.length ||
      corrects.some((index) => !isIndex(index, options.length))
    )
      throw new Error(
        "Choose the correct answers: corrects must list one or more valid zero-based option indexes.",
      );
    const all = sortedUnique(corrects as number[]);
    return { multiple: true, corrects: all, correct: all[0] };
  },
  serialize: ({ multiple, corrects, correct }) => ({
    multiple: multiple === true,
    ...(multiple === true
      ? { corrects: corrects?.length ? corrects : [correct ?? 0] }
      : {}),
  }),
  answer: {
    parse: (question, value) =>
      parseChoice(value, question.options.length, question.multiple === true),
    describe: describeLetters,
    simulate: simulateChoice,
  },
  results: {
    aggregate: (question, values) => tallyChoices(question.options, values),
  },
  // Several correct options: any wrong pick scores nothing, otherwise points scale
  // with the share of correct options found.
  score(question, answer) {
    const { corrects } = question;
    if (!corrects) return answer === question.correct ? 1 : 0;
    if (!Array.isArray(answer) || !answer.length) return 0;
    if (answer.some((index) => !corrects.includes(index))) return 0;
    return new Set(answer).size / corrects.length;
  },
  author: {
    toRaw: (input) => ({
      options: input.options,
      correct: input.correct,
      multiple: input.multiple === true,
      corrects: input.corrects,
    }),
  },
  prompt: {
    purpose: "Multiple choice quiz with one correct answer. Scored and ranked.",
    rules:
      'options: 2-6 strings (max 100 characters each). "correct": zero-based index of the right option (REQUIRED). Optional: competitive (boolean, default true = faster answers score more), showRanking (boolean, default true), revealMode ("live" or "onDone", default "onDone"). Optional multiple (boolean, default false): when true, more than one option is correct, "corrects" (array of zero-based indexes, REQUIRED) lists them all, "correct" must be the smallest of them, and players earn points in proportion to the correct options selected (any wrong option selected scores 0).',
  },
});
