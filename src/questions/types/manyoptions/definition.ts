import { parseChoice } from "../../platform/choice.ts";
import {
  defineQuestion,
  parseMultiple,
  sortedUnique,
  tallyChoices,
} from "../../platform/define.ts";
import type { VoteColor } from "../../platform/types.ts";
import {
  isVoteColorsValid,
  manyOptionLabels,
  manyOptionLength,
  manyOptionsMax,
} from "./helpers.ts";

export const manyoptions = defineQuestion({
  kind: "manyoptions",
  label: "Many options",
  hint: "Pick from up to 30 short options shown as a grid of boxes",
  tagline: "Pick from a big grid of short options.",
  traits: { optionsVisibleWhenHidden: true, playerAuthorable: false },
  options: {
    min: 2,
    max: manyOptionsMax,
    maxLength: manyOptionLength,
    message: `Add 2 to ${manyOptionsMax} nonempty options, up to ${manyOptionLength} characters each.`,
  },
  settings: ["multiple", "others", "voteColors"],
  create: () => ({
    title: "Which topics would you like us to cover?",
    options: [
      "Planning",
      "Design",
      "Testing",
      "Security",
      "Hiring",
      "Culture",
      "Budget",
      "Roadmap",
      "Support",
      "Tooling",
      "Metrics",
      "Training",
    ],
    correct: null,
    multiple: false,
    others: true,
  }),
  parse({ multiple, others, voteColors }, { canonical }) {
    if (others !== undefined && typeof others !== "boolean")
      throw new Error("Only many options questions can add an Others option.");
    if (voteColors !== undefined && !isVoteColorsValid(voteColors))
      throw new Error(
        "Vote colours need up to 8 steps with rising vote counts starting at 0 and #rrggbb colours.",
      );
    return {
      multiple: parseMultiple(multiple),
      others: others === true,
      ...(voteColors
        ? {
            voteColors: (voteColors as VoteColor[]).map(({ min, color }) => ({
              min,
              color: canonical ? color.toLowerCase() : color,
            })),
          }
        : {}),
    };
  },
  serialize: ({ multiple, others, voteColors }) => ({
    multiple: multiple === true,
    others: others === true,
    ...(voteColors ? { voteColors } : {}),
  }),
  answer: {
    parse: (question, value) =>
      parseChoice(
        value,
        manyOptionLabels(question).length,
        question.multiple === true,
      ),
    describe: (question, answer) => {
      const labels = manyOptionLabels(question);
      return (Array.isArray(answer) ? (answer as number[]) : [answer as number])
        .map((index) => labels[index] ?? "")
        .join(" · ");
    },
    simulate(question, random) {
      // "Others" is one more box after the listed options.
      const boxes = manyOptionLabels(question).length;
      const pickBox = () =>
        Math.min(boxes - 1, Math.floor(random() ** 1.6 * boxes));
      if (!question.multiple) return pickBox();
      const count = 1 + Math.floor(random() * Math.min(boxes, 4));
      return sortedUnique(Array.from({ length: count }, pickBox));
    },
  },
  results: {
    aggregate: (question, values) =>
      tallyChoices(manyOptionLabels(question), values),
  },
  prompt: {
    purpose:
      "Participants pick from a large set of short options (shown as a grid of boxes on the stage with a live vote count per box). Players get a search filter. Use it for choosing from many topics, names or items.",
    rules:
      'options: 2-30 strings (max 30 characters each). correct: null. Optional "multiple": boolean (true lets participants pick several options, default false). Optional "others": boolean (true adds an extra "Others" box after the options, default false). Optional "voteColors": array of up to 8 steps {"min": number of votes, "color": "#rrggbb"}; the first step must have min 0 and min must rise strictly (default: red at 0 votes, green from 1 vote). Optional revealMode as for poll.',
  },
});
