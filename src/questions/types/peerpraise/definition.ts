import { defineQuestion, parseText, pick } from "../../platform/define.ts";
import { sentences } from "../../platform/samples.ts";

export const peerpraise = defineQuestion({
  kind: "peerpraise",
  label: "Peer praise",
  hint: "Write something kind about another player",
  tagline: "Give each player someone else to write about.",
  traits: { defaultRevealMode: "onDone", assignsTargets: true },
  options: null,
  create: () => ({
    title: "Write a good word about this person.",
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
          text,
          count: 1,
          target: env.targetName(env.tokens[index]),
        }))
        .sort((first, second) => first.target.localeCompare(second.target)),
  },
  prompt: {
    purpose:
      "Peer praise. Each participant gets another participant's name and writes something kind about them.",
    rules:
      'options: []. correct: null. The title is the writing prompt (for example, "Write a good word about this person."). The server privately assigns one participant name to each player; assignments never point to the player themself when the room has more than one participant. For one participant, their own name is used. Best with 3 to 10 participants. Default revealMode: "onDone", so responses stay hidden until the host reveals them.',
  },
});
