import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import {
  createRoom,
  controlRoom,
  joinRoom,
  rooms,
  snapshot,
  submitVote,
} from "./rooms.mjs";
import { simulatedAnswer } from "./simulation.mjs";
import {
  importSession,
  newQuestion,
  newSession,
  serializeSession,
} from "../src/model.ts";

/**
 * Characterisation test: every question type's export, import, room validation, answer
 * checking, results and scores are compared with a recorded fixture. Regenerate it on
 * purpose with `GOLDEN_UPDATE=1 node --test server/questions.golden.test.mjs`.
 */
const fixturePath = new URL(
  "./fixtures/questions.golden.json",
  import.meta.url,
);

function seeded(seed) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const kinds = [
  "slide",
  "cloud",
  "poll",
  "quiz",
  "truefalse",
  "twotruths",
  "ranking",
  "slider",
  "qna",
  "points100",
  "grid2x2",
  "peerpraise",
  "manyoptions",
  "text",
];

const cases = [
  ...kinds.map((kind) => [kind, newQuestion(kind)]),
  [
    "poll-multiple",
    { ...newQuestion("poll"), multiple: true, pollDisplay: "pie" },
  ],
  [
    "quiz-multiple",
    { ...newQuestion("quiz"), multiple: true, corrects: [0, 2], correct: 0 },
  ],
  [
    "quiz-casual",
    { ...newQuestion("quiz"), competitive: false, showRanking: false },
  ],
  ["truefalse-onDone", { ...newQuestion("truefalse"), revealMode: "live" }],
  [
    "manyoptions-multiple",
    { ...newQuestion("manyoptions"), multiple: true, others: false },
  ],
  [
    "manyoptions-colours",
    {
      ...newQuestion("manyoptions"),
      voteColors: [
        { min: 0, color: "#AA0000" },
        { min: 3, color: "#00BB00" },
      ],
    },
  ],
  ["cloud-three", { ...newQuestion("cloud"), maxSubmissions: 3 }],
  ["text-onDone", { ...newQuestion("text"), revealMode: "onDone" }],
];

const invalidAnswers = [
  undefined,
  null,
  "",
  "  ",
  "word",
  "a".repeat(31),
  "a".repeat(281),
  -1,
  0,
  1,
  2,
  2.5,
  99,
  [],
  [0],
  [0, 0],
  [0, 1],
  [0, 1, 2],
  [0, 1, 2, 3],
  [99],
  [25, 25, 25, 25],
  [100, 0, 0, 0],
  [97, 1, 1, 1],
  { x: 1, y: 2 },
  { x: 500, y: 0 },
  { x: "1", y: 2 },
  {},
];

const strip = ({ id: _id, ...rest }) => rest;
const plainResults = (results) =>
  results
    .map(({ text, count }) => ({ text, count }))
    .sort((a, b) => a.text.localeCompare(b.text) || a.count - b.count);

function describeCase(name, question) {
  const session = { ...newSession("blank"), questions: [question] };
  const exported = JSON.parse(serializeSession(session)).questions[0];
  const imported = importSession(serializeSession(session)).questions[0];
  const reExported = JSON.parse(
    serializeSession({ ...session, questions: [imported] }),
  ).questions[0];
  assert.deepEqual(reExported, exported, `${name}: export survives import`);

  const random = seeded(7);
  const room = createRoom("Golden", [exported]);
  const roomQuestion = strip(room.questions[0]);
  const tokens = ["Ann", "Bob", "Cy", "Di", "Ed", "Flo"].map((n) =>
    joinRoom(room, n),
  );
  controlRoom(room, room.hostToken, "start", undefined, 1000);
  const id = room.questions[0].id;
  const accepted = [];
  tokens.forEach((token, index) => {
    const answer = simulatedAnswer(room.questions[0], random);
    if (answer === null) return;
    try {
      submitVote(room, token, id, answer, 1000 + (index + 1) * 2000);
      accepted.push(answer);
    } catch (error) {
      accepted.push(`rejected: ${error.message}`);
    }
  });
  if (name === "cloud-three")
    for (const [index, token] of tokens.slice(0, 2).entries()) {
      submitVote(room, token, id, `Extra ${index}`, 1000);
      submitVote(room, token, id, `extra ${index}`, 1000);
      assert.throws(() => submitVote(room, token, id, "again", 1000));
    }
  const host = snapshot(room, true).questions[0];
  const verdicts = invalidAnswers.map((value, index) => {
    const probe = joinRoom(room, `Probe${index}`);
    try {
      submitVote(room, probe, id, value, 5000);
      return "accepted";
    } catch {
      return "rejected";
    }
  });
  return {
    exported,
    roomQuestion,
    accepted,
    responses: host.responses,
    results: plainResults(host.results),
    leaderboard: snapshot(room, true).leaderboard,
    verdicts,
  };
}

test("every question type behaves as recorded", () => {
  const actual = Object.fromEntries(
    cases.map(([name, question]) => [name, describeCase(name, question)]),
  );
  for (const code of [...rooms.keys()]) rooms.delete(code);
  if (process.env.GOLDEN_UPDATE) {
    writeFileSync(fixturePath, `${JSON.stringify(actual, null, 2)}\n`);
    return;
  }
  const expected = JSON.parse(readFileSync(fixturePath, "utf8"));
  assert.deepEqual(Object.keys(actual), Object.keys(expected));
  for (const name of Object.keys(expected))
    assert.deepEqual(actual[name], expected[name], name);
});
