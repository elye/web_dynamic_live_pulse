import { parseChoice, simulateChoice } from "../../platform/choice.ts";
import {
  defineQuestion,
  describeLetters,
  tallyChoices,
} from "../../platform/define.ts";

export const truefalse = defineQuestion({
  kind: "truefalse",
  label: "True or false",
  hint: "A binary choice: true or false",
  tagline: "A quick binary call: true or false.",
  traits: {
    scored: true,
    defaultRevealMode: "onDone",
    optionsVisibleWhenHidden: true,
  },
  options: {
    min: 2,
    max: 2,
    maxLength: 100,
    message:
      "A true-or-false question needs exactly 2 nonempty answer options.",
  },
  create: () => ({
    title: "Octopuses have three hearts.",
    options: ["True", "False"],
    correct: 0,
  }),
  answer: {
    parse: (question, value) =>
      parseChoice(value, question.options.length, false),
    describe: describeLetters,
    simulate: simulateChoice,
  },
  results: {
    aggregate: (question, values) => tallyChoices(question.options, values),
  },
  author: {
    toRaw: (input) => ({ options: input.options, correct: input.correct }),
  },
  prompt: {
    purpose:
      "True or false statement. Scored and ranked. The title is the statement to judge.",
    rules:
      'options: exactly ["True","False"]. "correct": 0 if the statement is true, 1 if it is false (REQUIRED). Optional competitive, showRanking, revealMode as for quiz.',
  },
});
