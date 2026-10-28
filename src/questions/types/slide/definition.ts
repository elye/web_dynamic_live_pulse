import { defineQuestion } from "../../platform/define.ts";

export const slide = defineQuestion({
  kind: "slide",
  label: "Title & description",
  hint: "Just a title and description, no input needed",
  tagline: "Just a title and description. No input needed.",
  traits: {
    collectsAnswers: false,
    revealMode: false,
    playerAuthorable: false,
  },
  options: null,
  create: () => ({
    title: "A quick word before we dive in",
    description: "Take a breath, get comfortable, and get ready to share.",
    options: [],
    correct: null,
  }),
  parse(raw) {
    const { description } = raw;
    if (
      typeof description !== "string" ||
      !description.trim() ||
      description.length > 280
    )
      throw new Error("Add a description with 1 to 280 characters.");
    return { description: description.trim() };
  },
  serialize: ({ description }) => ({ description }),
  answer: {
    parse() {
      throw new Error("This slide does not accept responses.");
    },
    describe: () => "",
    simulate: () => null,
  },
  results: { aggregate: () => [] },
  prompt: {
    purpose:
      "Display-only title and description slide. Participants answer nothing. Use it for intros, section breaks and instructions.",
    rules:
      'options: []. correct: null. "description" is REQUIRED (1-280 characters). No revealMode.',
  },
});
