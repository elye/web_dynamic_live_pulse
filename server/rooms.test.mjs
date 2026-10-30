import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createRoom,
  joinRoom,
  renameParticipant,
  submitVote,
  submitUpvote,
  submitAuthored,
  controlRoom,
  scoreAnswer,
  snapshot,
  reactRoom,
  rooms,
  twoTruthsTitle,
} from "./rooms.mjs";
import { createAppServer } from "./index.mjs";
import { io as connect } from "socket.io-client";

const questions = [
  {
    type: "quiz",
    title: "Which one?",
    options: ["First", "Second"],
    correct: 1,
  },
  { type: "cloud", title: "One word?", options: [] },
];

test("title and description slides never accept responses and preserve content", () => {
  const slide = { type: "slide", title: "Agenda", description: "Welcome\nToday's topics", options: [] };
  const room = createRoom("Workshop", [slide, ...questions]);
  const token = joinRoom(room, "Alex");
  controlRoom(room, room.hostToken, "start");
  assert.equal(room.accepting, false);
  assert.equal(snapshot(room).questions[0].description, slide.description);
  assert.throws(() => submitVote(room, token, room.questions[0].id, "hello"), /does not accept/);
  assert.throws(() => controlRoom(room, room.hostToken, "toggle"), /does not accept/);
  assert.throws(() => controlRoom(room, room.hostToken, "reveal"), /no results/);
  controlRoom(room, room.hostToken, "select", 1);
  assert.equal(room.accepting, true);
  submitVote(room, token, room.questions[1].id, 1);
  controlRoom(room, room.hostToken, "select", 0);
  assert.equal(room.accepting, false);
  assert.deepEqual(snapshot(room, true).questions[0].results, []);
  assert.throws(() => createRoom("Invalid", [{ ...slide, description: "" }]), /description/);
  assert.throws(() => createRoom("Invalid", [{ ...slide, description: "a".repeat(281) }]), /description/);
  rooms.delete(room.code);
});

test("reveal mode defaults to live without an answer and onDone with one, hides results until reveal, and shows live results on the fly", () => {
  const room = createRoom("Modes", [
    { type: "poll", title: "Hidden?", options: ["A", "B"], revealMode: "onDone" },
    { type: "poll", title: "Live?", options: ["A", "B"], revealMode: "live" },
    { type: "qna", title: "Ask", options: [] },
    { type: "slide", title: "Hi", description: "Welcome", options: [] },
    { type: "cloud", title: "Cloud?", options: [] },
  ]);
  assert.deepEqual(
    room.questions.map((question) => question.revealMode),
    ["onDone", "live", undefined, undefined, "live"],
  );
  assert.throws(
    () => createRoom("Bad", [{ type: "poll", title: "x", options: ["A", "B"], revealMode: "soon" }]),
    /Reveal mode/,
  );
  const token = joinRoom(room, "Alex");
  controlRoom(room, room.hostToken, "start");
  submitVote(room, token, room.questions[0].id, 0);
  let audience = snapshot(room).questions[0];
  assert.equal(audience.responses, 1);
  assert.deepEqual(audience.results, []);
  controlRoom(room, room.hostToken, "reveal");
  assert.equal(snapshot(room).questions[0].results[0].count, 1);
  controlRoom(room, room.hostToken, "select", 1);
  assert.deepEqual(snapshot(room).questions[1].results.map((item) => item.count), [0, 0]);
  submitVote(room, token, room.questions[1].id, 1);
  audience = snapshot(room).questions[1];
  assert.deepEqual(audience.results.map((item) => item.count), [0, 1]);
  assert.equal(snapshot(room).revealed, false);
  assert.equal(audience.correct, null);
  rooms.delete(room.code);
});

test("peerpraise assignments are private, avoid self when possible, and reveal attributed responses", () => {
  const room = createRoom("Kind words", [
    {
      type: "peerpraise",
      title: "Write a good word about this person.",
      options: [],
    },
  ]);
  assert.equal(room.questions[0].revealMode, "onDone");
  const tokens = ["Alex", "Sam", "Kim", "Lee"].map((name) =>
    joinRoom(room, name),
  );
  controlRoom(room, room.hostToken, "start");
  const question = room.questions[0];
  const assignedNames = new Map();
  for (const token of tokens) {
    const assignedTo = snapshot(room, false, token).questions[0].assignedTo;
    assert.ok(assignedTo);
    assert.notEqual(assignedTo, room.participants.get(token).name);
    assignedNames.set(token, assignedTo);
  }
  assert.equal(snapshot(room, true).questions[0].assignedTo, undefined);

  tokens.forEach((token, index) =>
    submitVote(room, token, question.id, `Kind word ${index + 1}`),
  );
  assert.deepEqual(snapshot(room).questions[0].results, []);
  const hostResults = snapshot(room, true).questions[0].results;
  assert.equal(hostResults.length, tokens.length);
  assert.deepEqual(
    hostResults.map((result) => result.target).sort(),
    [...assignedNames.values()].sort(),
  );
  assert.equal(hostResults[0].count, 1);
  controlRoom(room, room.hostToken, "reveal");
  assert.equal(snapshot(room, false, tokens[0]).questions[0].results.length, 4);
  rooms.delete(room.code);

  const solo = createRoom("Solo kind words", [
    {
      type: "peerpraise",
      title: "Write a good word about this person.",
      options: [],
    },
  ]);
  const onlyPlayer = joinRoom(solo, "Taylor");
  controlRoom(solo, solo.hostToken, "start");
  assert.equal(
    snapshot(solo, false, onlyPlayer).questions[0].assignedTo,
    "Taylor",
  );
  rooms.delete(solo.code);
});

test("competition mode scores correctness plus speed and only applies to quiz and true-or-false", () => {
  const base = { options: ["A", "B"], correct: 0 };
  assert.throws(
    () => createRoom("Bad", [{ type: "poll", title: "P", options: ["A", "B"], competitive: true }]),
    /can be competitive/,
  );
  assert.throws(
    () => createRoom("Bad", [{ type: "quiz", title: "Q", ...base, competitive: "yes" }]),
    /can be competitive/,
  );
  const room = createRoom("Race", [
    { type: "quiz", title: "Race", ...base, competitive: true },
    { type: "truefalse", title: "Casual", ...base, competitive: false },
  ]);
  assert.equal(snapshot(room).competitive, true);
  assert.equal(room.questions[0].competitive, true);
  assert.equal(room.questions[1].competitive, false);
  const fast = joinRoom(room, "Fast");
  const slow = joinRoom(room, "Slow");
  const wrong = joinRoom(room, "Wrong");
  const late = joinRoom(room, "Late");
  controlRoom(room, room.hostToken, "start", undefined, 1000);
  const [race, casual] = room.questions;
  submitVote(room, fast, race.id, 0, 3000);
  submitVote(room, slow, race.id, 0, 11000);
  submitVote(room, wrong, race.id, 1, 1500);
  // Pausing and resuming must not restart the clock.
  controlRoom(room, room.hostToken, "toggle", undefined, 12000);
  controlRoom(room, room.hostToken, "toggle", undefined, 30000);
  submitVote(room, late, race.id, 0, 90000);
  controlRoom(room, room.hostToken, "reveal", undefined, 91000);
  const scores = Object.fromEntries(snapshot(room).leaderboard.map((entry) => [entry.name, entry.score]));
  assert.deepEqual(scores, { Fast: 950, Slow: 750, Late: 500, Wrong: 0 });
  controlRoom(room, room.hostToken, "select", 1, 92000);
  submitVote(room, slow, casual.id, 0, 93000);
  assert.equal(snapshot(room, true).leaderboard.find((entry) => entry.name === "Slow").score, 1750);
  rooms.delete(room.code);
  // Speed-based scoring is the default; it must be switched off explicitly.
  const plain = createRoom("Plain", [{ type: "quiz", title: "Q", ...base }]);
  assert.equal(snapshot(plain).competitive, true);
  assert.equal(plain.questions[0].competitive, true);
  rooms.delete(plain.code);
});

test("questions with answers default to hidden, ranking and podium steps are controlled by the host", () => {
  const base = { options: ["A", "B"], correct: 0 };
  const room = createRoom("Steps", [
    { type: "quiz", title: "Q1", ...base },
    { type: "truefalse", title: "Q2", ...base, showRanking: false },
    { type: "cloud", title: "Cloud", options: [] },
  ]);
  assert.deepEqual(room.questions.map((question) => question.revealMode), ["onDone", "onDone", "live"]);
  assert.deepEqual(room.questions.map((question) => question.showRanking), [true, false, undefined]);
  assert.throws(() => createRoom("Bad", [{ type: "quiz", title: "Q", ...base, showRanking: "yes" }]), /Show ranking/);
  const ann = joinRoom(room, "Ann");
  controlRoom(room, room.hostToken, "start", undefined, 1000);
  submitVote(room, ann, room.questions[0].id, 0, 2000);
  assert.equal(snapshot(room).scored, true);
  assert.deepEqual(snapshot(room).leaderboard, []);
  controlRoom(room, room.hostToken, "ranking");
  let state = snapshot(room);
  assert.equal(state.ranking, true);
  // Answered one second into the 20 second window: 500 + 500 * (1 - 1/20).
  assert.equal(state.leaderboard[0].score, 975);
  controlRoom(room, room.hostToken, "select", 1, 3000);
  state = snapshot(room);
  assert.equal(state.ranking, false);
  assert.equal(state.revealed, false);
  controlRoom(room, room.hostToken, "select", 2, 4000);
  controlRoom(room, room.hostToken, "podium");
  state = snapshot(room);
  assert.equal(state.podium, true);
  assert.equal(state.ranking, false);
  assert.equal(state.leaderboard[0].name, "Ann");
  rooms.delete(room.code);
  const plain = createRoom("Plain", [{ type: "cloud", title: "C", options: [] }]);
  controlRoom(plain, plain.hostToken, "start");
  assert.equal(snapshot(plain).scored, false);
  assert.throws(() => controlRoom(plain, plain.hostToken, "podium"), /no questions with answers/);
  rooms.delete(plain.code);
});

test("hearts are throttled per participant, need a joined member, and stop when the session ends", () => {
  const room = createRoom("Hearts", questions);
  const first = joinRoom(room, "Alex");
  const second = joinRoom(room, "Sam");
  assert.throws(() => reactRoom(room, "nobody"), /Join the room/);
  assert.equal(reactRoom(room, first, 1000), true);
  assert.equal(reactRoom(room, first, 1050), false);
  assert.equal(reactRoom(room, second, 1050), true);
  assert.equal(reactRoom(room, first, 1300), true);
  assert.equal(room.hearts, 3);
  assert.equal("hearts" in snapshot(room), false);
  controlRoom(room, room.hostToken, "end");
  assert.equal(reactRoom(room, first, 5000), false);
  rooms.delete(room.code);
});

test("hearts reach only the host over websockets and do not use up the request budget", async () => {
  const { http } = createAppServer();
  await new Promise((resolve) => http.listen(0, resolve));
  const url = `http://localhost:${http.address().port}`;
  const host = connect(url, { transports: ["websocket"], forceNew: true });
  const guest = connect(url, { transports: ["websocket"], forceNew: true });
  try {
    const created = await host.timeout(3000).emitWithAck("room:create", { title: "Hearts", questions });
    const code = created.state.code;
    const joined = await guest.timeout(3000).emitWithAck("room:join", { code, name: "Alex" });
    let hostHearts = 0;
    let guestHearts = 0;
    host.on("room:heart", () => hostHearts++);
    guest.on("room:heart", () => guestHearts++);
    const reply = await guest.timeout(3000).emitWithAck("room:react", { code, token: joined.token });
    assert.equal(reply.ok, true);
    assert.equal(reply.sent, true);
    const spam = await Promise.all(
      Array.from({ length: 150 }, () => guest.timeout(3000).emitWithAck("room:react", { code, token: joined.token })),
    );
    assert.ok(spam.every((item) => item.ok));
    assert.ok(spam.filter((item) => item.sent).length <= 1);
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.ok(hostHearts >= 1 && hostHearts <= 2);
    assert.equal(guestHearts, 0);
  } finally {
    host.disconnect();
    guest.disconnect();
    await new Promise((resolve) => http.close(resolve));
  }
});

test("one vote per participant, private answers, and server-calculated scores", () => {
  const room = createRoom("Team check-in", questions);
  const token = joinRoom(room, "Alex");
  assert.equal(joinRoom(room, "Alex", token), token);
  assert.equal(room.participants.size, 1);
  assert.equal(snapshot(room).questions[0].correct, null);
  controlRoom(room, room.hostToken, "start");
  submitVote(room, token, room.questions[0].id, 1);
  assert.throws(
    () => submitVote(room, token, room.questions[0].id, 0),
    /already/,
  );
  assert.deepEqual(snapshot(room).questions[0].results, []);
  assert.deepEqual(snapshot(room).leaderboard, []);
  assert.throws(() => controlRoom(room, token, "reveal"), /host/);
  controlRoom(room, room.hostToken, "reveal");
  assert.equal(snapshot(room).questions[0].correct, 1);
  // Real clock: an instant answer scores just under the 1000 maximum.
  assert.ok(snapshot(room).leaderboard[0].score >= 990);
  assert.throws(
    () => submitVote(room, joinRoom(room, "Sam"), room.questions[0].id, 0),
    /no longer/,
  );
  rooms.delete(room.code);
});

test("nameless rooms assign unique name-like labels and preserve them on rejoin", () => {
  const room = createRoom("Anonymous check-in", questions, undefined, true);
  assert.equal(room.nameless, true);
  const first = joinRoom(room);
  const second = joinRoom(room, "This name is ignored");
  const firstName = room.participants.get(first).name;
  const secondName = room.participants.get(second).name;
  assert.equal(room.participants.get(first).generated, true);
  assert.equal(room.participants.get(second).generated, true);
  assert.match(firstName, /^[A-Za-z]+ [A-Za-z]+$/);
  assert.match(secondName, /^[A-Za-z]+ [A-Za-z]+$/);
  assert.notEqual(firstName, secondName);
  assert.equal(joinRoom(room, "Another name", first), first);
  assert.equal(room.participants.get(first).name, firstName);
  assert.equal(snapshot(room).nameless, true);
  assert.deepEqual(snapshot(room).participantNames, [firstName, secondName]);
  rooms.delete(room.code);

  const named = createRoom("Named check-in", questions);
  assert.throws(() => joinRoom(named), /Enter a name/);
  rooms.delete(named.code);
});

test("participants can rename themselves once while the session is active", () => {
  const room = createRoom("Rename check-in", questions, undefined, true);
  const token = joinRoom(room);
  const generatedName = room.participants.get(token).name;
  controlRoom(room, room.hostToken, "start");
  const member = renameParticipant(room, token, "Taylor");
  assert.equal(member.name, "Taylor");
  assert.equal(member.generated, false);
  assert.equal(member.nameChanged, true);
  assert.notEqual(member.name, generatedName);
  assert.throws(
    () => renameParticipant(room, token, "Another name"),
    /only be changed once/,
  );
  assert.equal(snapshot(room, true).leaderboard[0].generated, false);
  controlRoom(room, room.hostToken, "end");
  assert.throws(
    () => renameParticipant(room, token, "Too late"),
    /while the session is active/,
  );
  rooms.delete(room.code);

  const generatedRoom = createRoom("Generated podium", questions, undefined, true);
  joinRoom(generatedRoom);
  controlRoom(generatedRoom, generatedRoom.hostToken, "start");
  assert.equal(snapshot(generatedRoom, true).leaderboard[0].generated, true);
  rooms.delete(generatedRoom.code);
});

test("question changes reject stale answers and aggregate words case-insensitively", () => {
  const room = createRoom("Workshop", questions);
  const firstToken = joinRoom(room, "Alex");
  const secondToken = joinRoom(room, "Sam");
  controlRoom(room, room.hostToken, "start");
  assert.throws(
    () => submitVote(room, firstToken, room.questions[0].id, 5),
    /available/,
  );
  controlRoom(room, room.hostToken, "select", 1);
  assert.throws(
    () => submitVote(room, firstToken, room.questions[0].id, 1),
    /no longer/,
  );
  submitVote(room, firstToken, room.questions[1].id, " Excited ");
  submitVote(room, secondToken, room.questions[1].id, "excited");
  assert.deepEqual(snapshot(room, true).questions[1].results, [
    { text: "excited", count: 2 },
  ]);
  controlRoom(room, room.hostToken, "end");
  assert.throws(() => joinRoom(room, "New person"), /ended/);
  assert.throws(() => controlRoom(room, room.hostToken, "toggle"), /ended/);
  rooms.delete(room.code);
});

test("word clouds can allow multiple submissions per participant", () => {
  const room = createRoom("Workshop", [
    { type: "cloud", title: "Share words", options: [], maxSubmissions: 3 },
  ]);
  const token = joinRoom(room, "Alex");
  const other = joinRoom(room, "Sam");
  controlRoom(room, room.hostToken, "start");
  submitVote(room, token, room.questions[0].id, " Curious ");
  submitVote(room, token, room.questions[0].id, "curious");
  submitVote(room, token, room.questions[0].id, "Ready");
  assert.throws(
    () => submitVote(room, token, room.questions[0].id, "Again"),
    /already/,
  );
  submitVote(room, other, room.questions[0].id, "ready");
  const question = snapshot(room, true).questions[0];
  assert.equal(question.responses, 4);
  assert.deepEqual(question.results, [
    { text: "curious", count: 2 },
    { text: "ready", count: 2 },
  ]);
  rooms.delete(room.code);
});

test("invalid question definitions cannot create a room", () => {
  assert.throws(() => createRoom("Empty", []), /between/);
  assert.throws(
    () => createRoom("Invalid", [{ ...questions[0], correct: 3 }]),
    /correct/,
  );
  assert.throws(
    () => createRoom("Invalid", [{ ...questions[0], options: ["", "A"] }]),
    /options/,
  );
  assert.throws(
    () =>
      createRoom("Invalid", [
        { type: "cloud", title: "Cloud", options: [], maxSubmissions: 0 },
      ]),
    /Word clouds/,
  );
  assert.throws(
    () =>
      createRoom("Invalid", [
        { type: "cloud", title: "Cloud", options: [], maxSubmissions: 6 },
      ]),
    /Word clouds/,
  );
});

test("true-or-false questions score like quizzes and require exactly two options", () => {
  const truefalse = {
    type: "truefalse",
    title: "The sky is blue.",
    options: ["True", "False"],
    correct: 0,
  };
  assert.throws(
    () => createRoom("Invalid", [{ ...truefalse, options: ["True"] }]),
    /exactly 2/,
  );
  assert.throws(
    () => createRoom("Invalid", [{ ...truefalse, correct: 2 }]),
    /correct/,
  );
  const room = createRoom("Pop quiz", [truefalse]);
  const token = joinRoom(room, "Alex");
  controlRoom(room, room.hostToken, "start");
  submitVote(room, token, room.questions[0].id, 0);
  controlRoom(room, room.hostToken, "reveal");
  assert.deepEqual(snapshot(room, true).questions[0].results, [
    { text: "True", count: 1 },
    { text: "False", count: 0 },
  ]);
  assert.ok(snapshot(room).leaderboard[0].score >= 990);
  rooms.delete(room.code);
});

test("two truths and a lie has a fixed question, exactly 3 statements, and scores like a quiz", () => {
  const twotruths = {
    type: "twotruths",
    title: "ignored",
    options: ["I ran a marathon.", "I own a parrot.", "I was born in Mars."],
    correct: 2,
  };
  assert.throws(
    () => createRoom("Invalid", [{ ...twotruths, options: ["A", "B"] }]),
    /exactly 3/,
  );
  assert.throws(
    () => createRoom("Invalid", [{ ...twotruths, options: ["A", "B", ""] }]),
    /exactly 3/,
  );
  assert.throws(() => createRoom("Invalid", [{ ...twotruths, correct: 3 }]), /correct/);
  const room = createRoom("Peer praise", [twotruths]);
  assert.equal(room.questions[0].title, twoTruthsTitle);
  const right = joinRoom(room, "Alex");
  const wrong = joinRoom(room, "Sam");
  controlRoom(room, room.hostToken, "start");
  submitVote(room, right, room.questions[0].id, 2);
  submitVote(room, wrong, room.questions[0].id, 0);
  controlRoom(room, room.hostToken, "reveal");
  assert.equal(snapshot(room).questions[0].correct, 2);
  const board = snapshot(room).leaderboard;
  assert.equal(board[0].name, "Alex");
  assert.ok(board[0].score >= 990);
  rooms.delete(room.code);
});

test("ranking questions collect a full permutation and score with Borda points", () => {
  const ranking = {
    type: "ranking",
    title: "Rank these from most to least important",
    options: ["Speed", "Quality", "Cost"],
    correct: null,
  };
  assert.throws(
    () => createRoom("Invalid", [{ ...ranking, options: ["Only one"] }]),
    /2 to 6/,
  );
  const room = createRoom("Priorities", [ranking]);
  const firstToken = joinRoom(room, "Alex");
  const secondToken = joinRoom(room, "Sam");
  controlRoom(room, room.hostToken, "start");
  assert.throws(
    () => submitVote(room, firstToken, room.questions[0].id, [0, 1]),
    /exactly once/,
  );
  assert.throws(
    () => submitVote(room, firstToken, room.questions[0].id, 0),
    /exactly once/,
  );
  submitVote(room, firstToken, room.questions[0].id, [0, 1, 2]);
  submitVote(room, secondToken, room.questions[0].id, [1, 0, 2]);
  controlRoom(room, room.hostToken, "reveal");
  assert.deepEqual(snapshot(room, true).questions[0].results, [
    { text: "Speed", count: 5 },
    { text: "Quality", count: 5 },
    { text: "Cost", count: 2 },
  ]);
  assert.ok(snapshot(room).leaderboard.every((entry) => entry.score === 0));
  rooms.delete(room.code);
});

test("multiple choice polls can allow several answers per participant", () => {
  const poll = { type: "poll", title: "Pick any", options: ["A", "B", "C"], correct: null, multiple: true };
  assert.throws(
    () => createRoom("Invalid", [{ ...questions[1], multiple: true }]),
    /multiple/i,
  );
  const room = createRoom("Multi", [poll]);
  const first = joinRoom(room, "Alex");
  const second = joinRoom(room, "Sam");
  controlRoom(room, room.hostToken, "start");
  const id = room.questions[0].id;
  assert.throws(() => submitVote(room, first, id, 0), /one or more/);
  assert.throws(() => submitVote(room, first, id, []), /one or more/);
  assert.throws(() => submitVote(room, first, id, [0, 0]), /one or more/);
  assert.throws(() => submitVote(room, first, id, [3]), /one or more/);
  submitVote(room, first, id, [2, 0]);
  submitVote(room, second, id, [0]);
  controlRoom(room, room.hostToken, "reveal");
  const question = snapshot(room, true).questions[0];
  assert.equal(question.multiple, true);
  assert.equal(question.responses, 2);
  assert.deepEqual(question.results.map((item) => item.count), [2, 0, 1]);
  rooms.delete(room.code);
});

/** Creates a started room with one multi-answer quiz and returns helpers to answer and score it. */
function multiQuizRoom(extra = {}, optionCount = 4) {
  const options = ["A", "B", "C", "D", "E", "F"].slice(0, optionCount);
  const room = createRoom("Multi quiz", [
    { type: "quiz", title: "Pick all", options, multiple: true, corrects: [0, 2], competitive: false, ...extra },
  ]);
  const t0 = 1_000_000;
  controlRoom(room, room.hostToken, "start", undefined, t0);
  const question = room.questions[0];
  let player = 0;
  return {
    room,
    question,
    /** One new player answers `value` after `afterMs`, and their score is returned. */
    play(value, afterMs = 0) {
      const token = joinRoom(room, `P${player++}`);
      submitVote(room, token, question.id, value, t0 + afterMs);
      return { token, score: scoreAnswer(room, question, token) };
    },
  };
}

test("multi-answer quiz definitions validate corrects and store them sorted and unique", () => {
  const quiz = { type: "quiz", title: "Primes", options: ["2", "3", "4", "5"], multiple: true, corrects: [3, 0, 1, 1] };
  assert.throws(() => createRoom("Invalid", [{ ...quiz, corrects: [] }]), /correct/i);
  assert.throws(() => createRoom("Invalid", [{ ...quiz, corrects: [9] }]), /correct/i);
  assert.throws(() => createRoom("Invalid", [{ ...quiz, corrects: [-1] }]), /correct/i);
  assert.throws(() => createRoom("Invalid", [{ ...quiz, corrects: undefined }]), /correct/i);
  const room = createRoom("Multi quiz", [quiz]);
  assert.deepEqual(room.questions[0].corrects, [0, 1, 3]);
  assert.equal(room.questions[0].correct, 0);
  rooms.delete(room.code);
});

test("multi-answer quiz votes must be a non-empty list of distinct valid options", () => {
  const { room, question } = multiQuizRoom();
  const token = joinRoom(room, "Alex");
  for (const bad of [0, [], [0, 0], [4], [-1], ["0"], null])
    assert.throws(() => submitVote(room, token, question.id, bad), /one or more/);
  rooms.delete(room.code);
});

test("multi-answer quiz: partial credit is proportional, rounded to the nearest whole point", () => {
  // Three correct options (A, C, E) out of five.
  const { room, play } = multiQuizRoom({ corrects: [0, 2, 4] }, 5);
  assert.equal(play([0, 2, 4]).score, 1000, "all correct");
  assert.equal(play([4, 0]).score, 667, "2 of 3 = 666.67 rounds up");
  assert.equal(play([2]).score, 333, "1 of 3 = 333.33 rounds down");
  assert.equal(play([0, 0 + 2]).score, 667, "order does not matter");
  rooms.delete(room.code);
});

test("multi-answer quiz: any wrong option picked scores zero", () => {
  const { room, play } = multiQuizRoom({ corrects: [0, 2] });
  assert.equal(play([0, 2]).score, 1000);
  assert.equal(play([0]).score, 500);
  assert.equal(play([0, 1]).score, 0, "one right, one wrong");
  assert.equal(play([1]).score, 0, "only wrong");
  assert.equal(play([0, 2, 3]).score, 0, "all right plus one wrong");
  assert.equal(play([0, 1, 2, 3]).score, 0, "everything selected");
  rooms.delete(room.code);
});

test("multi-answer quiz: rounding of every share from 1/6 to 6/6", () => {
  const { room, play } = multiQuizRoom({ corrects: [0, 1, 2, 3, 4, 5] }, 6);
  const expected = [167, 333, 500, 667, 833, 1000]; // 1000 * n / 6, rounded
  expected.forEach((score, index) =>
    assert.equal(play(Array.from({ length: index + 1 }, (_, i) => i)).score, score),
  );
  rooms.delete(room.code);
});

test("multi-answer quiz: speed scoring is scaled by the share and rounded last", () => {
  // 3000 ms in: 500 + round(500 * (1 - 3000 / 20000)) = 925 for a fully correct answer.
  const { room, play } = multiQuizRoom({ corrects: [0, 1], competitive: true });
  assert.equal(play([0, 1], 3000).score, 925);
  assert.equal(play([0], 3000).score, 463, "925 / 2 = 462.5 rounds up");
  assert.equal(play([0, 2], 3000).score, 0, "wrong option scores zero even when fast");
  // Slow answers keep the 500 base: half of it is 250.
  assert.equal(play([1], 60_000).score, 250);
  rooms.delete(room.code);
});

test("multi-answer quiz: an author never scores their own question and unanswered players score zero", () => {
  const { room, question, play } = multiQuizRoom({ corrects: [0, 1] });
  const idle = joinRoom(room, "Idle");
  assert.equal(scoreAnswer(room, question, idle), 0);
  const { token } = play([0, 1]);
  room.authors.set(question.id, token);
  assert.equal(scoreAnswer(room, question, token), 0);
  rooms.delete(room.code);
});

test("multi-answer quiz: the leaderboard uses the partial scores", () => {
  const { room, play } = multiQuizRoom({ corrects: [0, 1, 2] }, 4);
  play([0, 1, 2]);
  play([0, 1]);
  play([0, 3]);
  controlRoom(room, room.hostToken, "reveal");
  const board = Object.fromEntries(snapshot(room, true).leaderboard.map((e) => [e.name, e.score]));
  assert.deepEqual(board, { P0: 1000, P1: 667, P2: 0 });
  rooms.delete(room.code);
});

test("multi-answer quiz: results count every selected option, right or wrong", () => {
  // Correct answers are A and C. Players pick B+C, A, A+C and D+B.
  const { room, play } = multiQuizRoom({ corrects: [0, 2] });
  play([1, 2]);
  play([0]);
  play([0, 2]);
  play([3, 1]);
  const counts = () => snapshot(room, true).questions[0].results.map((item) => item.count);
  assert.deepEqual(counts(), [2, 2, 2, 1], "A=2, B=2, C=2, D=1");
  assert.equal(snapshot(room, true).questions[0].responses, 4, "counted per player, not per pick");
  // Hidden from players until revealed, then visible with the correct answers.
  assert.deepEqual(snapshot(room).questions[0].results, []);
  assert.deepEqual(snapshot(room).questions[0].corrects, []);
  controlRoom(room, room.hostToken, "reveal");
  assert.deepEqual(snapshot(room).questions[0].results.map((item) => item.count), [2, 2, 2, 1]);
  assert.deepEqual(snapshot(room).questions[0].corrects, [0, 2]);
  rooms.delete(room.code);
});

test("multi-answer poll: results count every selected option and responses count players", () => {
  const room = createRoom("Poll", [{ type: "poll", title: "Pick any", options: ["A", "B", "C"], multiple: true }]);
  const a = joinRoom(room, "A");
  const b = joinRoom(room, "B");
  const c = joinRoom(room, "C");
  controlRoom(room, room.hostToken, "start");
  const id = room.questions[0].id;
  submitVote(room, a, id, [0, 1, 2]);
  submitVote(room, b, id, [1]);
  submitVote(room, c, id, [2, 1]);
  const [question] = snapshot(room, true).questions;
  assert.deepEqual(question.results.map((item) => item.count), [1, 3, 2]);
  assert.equal(question.responses, 3);
  rooms.delete(room.code);
});

test("many options validates its limits, colours and the Others box", () => {
  const options = (count, text = "x") => Array.from({ length: count }, (_, index) => `${text}${index}`);
  const make = (extra) => ({ type: "manyoptions", title: "Pick", options: options(12), ...extra });
  rooms.delete(createRoom("Ok", [make({ others: true })]).code);
  rooms.delete(createRoom("Max", [make({ options: options(30) })]).code);
  assert.throws(() => createRoom("Few", [make({ options: ["only"] })]), /options/);
  assert.throws(() => createRoom("Many", [make({ options: options(31) })]), /options/);
  assert.throws(() => createRoom("Long", [make({ options: ["a".repeat(31), "b"] })]), /30 characters/);
  assert.throws(() => createRoom("Colour", [make({ voteColors: [{ min: 1, color: "#ffffff" }] })]), /colour/i);
  assert.throws(() => createRoom("Colour", [make({ voteColors: [{ min: 0, color: "red" }] })]), /colour/i);
  const room = createRoom("Colours", [
    make({ voteColors: [{ min: 0, color: "#AA0000" }, { min: 5, color: "#00BB00" }] }),
  ]);
  assert.deepEqual(room.questions[0].voteColors, [
    { min: 0, color: "#aa0000" },
    { min: 5, color: "#00bb00" },
  ]);
  rooms.delete(room.code);
});

test("many options counts votes per box in order, with an optional Others box", () => {
  const room = createRoom("Many", [
    { type: "manyoptions", title: "Pick", options: ["A", "B", "C"], others: true },
    { type: "manyoptions", title: "Any", options: ["A", "B", "C"], multiple: true },
  ]);
  const a = joinRoom(room, "A");
  const b = joinRoom(room, "B");
  const c = joinRoom(room, "C");
  controlRoom(room, room.hostToken, "start");
  const [single, multiple] = room.questions.map((question) => question.id);
  submitVote(room, a, single, 3);
  submitVote(room, b, single, 0);
  assert.throws(() => submitVote(room, c, single, 4), /option/i);
  assert.throws(() => submitVote(room, c, single, [0, 1]), /option|answer/i);
  let [question] = snapshot(room, true).questions;
  assert.deepEqual(question.results.map((item) => [item.text, item.count]), [
    ["A", 1],
    ["B", 0],
    ["C", 0],
    ["Others", 1],
  ]);
  controlRoom(room, room.hostToken, "select", 1);
  submitVote(room, a, multiple, [0, 2]);
  submitVote(room, b, multiple, [2]);
  assert.throws(() => submitVote(room, c, multiple, [3]), /option/i);
  question = snapshot(room, true).questions[1];
  assert.deepEqual(question.results.map((item) => item.count), [1, 0, 2]);
  rooms.delete(room.code);
});

test("single-answer quizzes still score all or nothing", () => {
  const room = createRoom("Single", [{ type: "quiz", title: "One", options: ["A", "B"], correct: 1, competitive: false }]);
  const right = joinRoom(room, "Right");
  const wrong = joinRoom(room, "Wrong");
  controlRoom(room, room.hostToken, "start");
  const [question] = room.questions;
  submitVote(room, right, question.id, 1);
  submitVote(room, wrong, question.id, 0);
  assert.equal(scoreAnswer(room, question, right), 1000);
  assert.equal(scoreAnswer(room, question, wrong), 0);
  rooms.delete(room.code);
});

test("100 Points questions require allocations that sum to exactly 100 and aggregate totals", () => {
  const points100 = {
    type: "points100",
    title: "Allocate 100 points across what matters most to you",
    options: ["Design", "Performance", "Reliability"],
    correct: null,
  };
  assert.throws(
    () => createRoom("Invalid", [{ ...points100, options: ["Only one"] }]),
    /2 to 6/,
  );
  const room = createRoom("Priorities", [points100]);
  const firstToken = joinRoom(room, "Alex");
  const secondToken = joinRoom(room, "Sam");
  controlRoom(room, room.hostToken, "start");
  assert.throws(
    () => submitVote(room, firstToken, room.questions[0].id, [50, 50]),
    /exactly 100/,
  );
  assert.throws(
    () => submitVote(room, firstToken, room.questions[0].id, [40, 40, 40]),
    /exactly 100/,
  );
  assert.throws(
    () => submitVote(room, firstToken, room.questions[0].id, [-10, 60, 50]),
    /exactly 100/,
  );
  assert.throws(
    () => submitVote(room, firstToken, room.questions[0].id, [50.5, 49.5, 0]),
    /exactly 100/,
  );
  submitVote(room, firstToken, room.questions[0].id, [60, 30, 10]);
  submitVote(room, secondToken, room.questions[0].id, [20, 20, 60]);
  controlRoom(room, room.hostToken, "reveal");
  assert.deepEqual(snapshot(room, true).questions[0].results, [
    { text: "Design", count: 80 },
    { text: "Reliability", count: 70 },
    { text: "Performance", count: 50 },
  ]);
  assert.ok(snapshot(room).leaderboard.every((entry) => entry.score === 0));
  rooms.delete(room.code);
});

test("2x2 Grid questions require exactly 4 axis labels and a point between -100 and 100 on each axis", () => {
  const grid2x2 = {
    type: "grid2x2",
    title: "Place your priority on the grid",
    options: ["Low urgency", "High urgency", "Low impact", "High impact"],
    correct: null,
  };
  assert.throws(
    () =>
      createRoom("Invalid", [
        { ...grid2x2, options: ["Only one", "Two", "Three"] },
      ]),
    /exactly 4 axis labels/,
  );
  const room = createRoom("Priorities", [grid2x2]);
  const firstToken = joinRoom(room, "Alex");
  const secondToken = joinRoom(room, "Sam");
  controlRoom(room, room.hostToken, "start");
  assert.throws(
    () => submitVote(room, firstToken, room.questions[0].id, { x: 150, y: 0 }),
    /between -100 and 100/,
  );
  assert.throws(
    () => submitVote(room, firstToken, room.questions[0].id, [10, 10]),
    /between -100 and 100/,
  );
  assert.throws(
    () => submitVote(room, firstToken, room.questions[0].id, { x: "a", y: 0 }),
    /between -100 and 100/,
  );
  submitVote(room, firstToken, room.questions[0].id, { x: 40, y: 30 });
  submitVote(room, secondToken, room.questions[0].id, { x: -20, y: 10 });
  controlRoom(room, room.hostToken, "reveal");
  assert.deepEqual(snapshot(room, true).questions[0].results, [
    { text: "Average: 10,20", count: 2 },
    { text: "40,30", count: 1 },
    { text: "-20,10", count: 1 },
  ]);
  assert.ok(snapshot(room).leaderboard.every((entry) => entry.score === 0));
  rooms.delete(room.code);
});

test("slider questions require a valid range and aggregate average plus distribution", () => {
  const slider = {
    type: "slider",
    title: "How many hours a day do you spend in meetings?",
    options: [],
    correct: null,
    sliderMin: 0,
    sliderMax: 10,
    sliderStep: 1,
  };
  assert.throws(
    () => createRoom("Invalid", [{ ...slider, sliderMax: 0 }]),
    /slider minimum/,
  );
  assert.throws(
    () => createRoom("Invalid", [{ ...slider, sliderStep: 0 }]),
    /slider minimum/,
  );
  const room = createRoom("Meeting load", [slider]);
  const firstToken = joinRoom(room, "Alex");
  const secondToken = joinRoom(room, "Sam");
  controlRoom(room, room.hostToken, "start");
  assert.throws(
    () => submitVote(room, firstToken, room.questions[0].id, 11),
    /slider/,
  );
  assert.throws(
    () => submitVote(room, firstToken, room.questions[0].id, 4.5),
    /slider/,
  );
  submitVote(room, firstToken, room.questions[0].id, 4);
  submitVote(room, secondToken, room.questions[0].id, 8);
  controlRoom(room, room.hostToken, "reveal");
  assert.deepEqual(snapshot(room, true).questions[0].results, [
    { text: "Average: 6", count: 2 },
    { text: "4", count: 1 },
    { text: "8", count: 1 },
  ]);
  assert.ok(snapshot(room).leaderboard.every((entry) => entry.score === 0));
  rooms.delete(room.code);
});

test("Q&A questions let anyone submit and upvote entries, with live results before reveal", () => {
  const qna = { type: "qna", title: "Ask us anything", options: [], correct: null };
  const room = createRoom("Office hours", [qna]);
  const firstToken = joinRoom(room, "Alex");
  const secondToken = joinRoom(room, "Sam");
  const thirdToken = joinRoom(room, "Jordan");
  controlRoom(room, room.hostToken, "start");
  assert.throws(
    () => submitUpvote(room, firstToken, room.questions[0].id, firstToken),
    /no longer exists/,
  );
  submitVote(room, firstToken, room.questions[0].id, "What's next for the roadmap?");
  submitVote(room, secondToken, room.questions[0].id, "Can we see a demo?");
  // Results are visible live, before any reveal, unlike other question types.
  assert.equal(snapshot(room).questions[0].results.length, 2);
  assert.equal(snapshot(room).questions[0].responses, 2);
  assert.equal(submitUpvote(room, secondToken, room.questions[0].id, firstToken), true);
  assert.equal(submitUpvote(room, thirdToken, room.questions[0].id, firstToken), true);
  assert.equal(submitUpvote(room, secondToken, room.questions[0].id, secondToken), true);
  // Toggling the same upvote again removes it.
  assert.equal(submitUpvote(room, secondToken, room.questions[0].id, secondToken), false);
  assert.deepEqual(
    snapshot(room).questions[0].results.map(({ text, count }) => ({ text, count })),
    [
      { text: "What's next for the roadmap?", count: 2 },
      { text: "Can we see a demo?", count: 0 },
    ],
  );
  assert.throws(
    () => submitUpvote(room, firstToken, room.questions[0].id, "unknown-token"),
    /no longer exists/,
  );
  controlRoom(room, room.hostToken, "toggle");
  assert.throws(
    () => submitUpvote(room, firstToken, room.questions[0].id, secondToken),
    /no longer accepting/,
  );
  assert.ok(snapshot(room).leaderboard.every((entry) => entry.score === 0));
  rooms.delete(room.code);
});

test("websocket host and audience complete a live round and reconnect", async () => {
  const { http, io } = createAppServer();
  await new Promise((resolve) => http.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${http.address().port}`;
  const host = connect(url, { transports: ["websocket"], forceNew: true });
  const audience = connect(url, { transports: ["websocket"], forceNew: true });
  const request = (socket, event, payload) =>
    socket.timeout(3000).emitWithAck(event, payload);
  try {
    const created = await request(host, "room:create", {
      title: "Live test",
      questions,
    });
    assert.equal(created.ok, true);
    const code = created.state.code;
    const info = await request(audience, "room:info", { code });
    assert.equal(info.nameless, false);
    const joined = await request(audience, "room:join", {
      code,
      name: "Taylor",
    });
    assert.equal(joined.name, "Taylor");
    assert.equal(joined.generated, false);
    assert.equal(joined.nameChangeUsed, false);
    assert.equal(joined.state.questions[0].correct, null);
    assert.equal(joined.state.started, false);
    assert.deepEqual(joined.state.participantNames, ["Taylor"]);
    const renamed = await request(audience, "room:rename", {
      code,
      token: joined.token,
      name: "Taylor Prime",
    });
    assert.equal(renamed.name, "Taylor Prime");
    assert.equal(renamed.generated, false);
    assert.equal(renamed.nameChangeUsed, true);
    assert.deepEqual(renamed.state.participantNames, ["Taylor Prime"]);
    const renamedAgain = await request(audience, "room:rename", {
      code,
      token: joined.token,
      name: "Taylor Final",
    });
    assert.equal(renamedAgain.ok, false);
    assert.match(renamedAgain.error, /only be changed once/);
    const started = new Promise((resolve) => audience.once("room:state", resolve));
    await request(host, "room:control", { code, token: created.token, action: "start" });
    assert.equal((await started).started, true);

    test("welcome lobby lists names without tokens and only the host can open voting", () => {
      const room = createRoom("Welcome", questions);
      const token = joinRoom(room, "Alex");
      joinRoom(room, "Sam");
      joinRoom(room, "Alex", token);
      const state = snapshot(room);
      assert.equal(state.started, false);
      assert.equal(state.accepting, false);
      assert.equal(state.participants, 2);
      assert.deepEqual(state.participantNames, ["Alex", "Sam"]);
      assert.equal(JSON.stringify(state).includes(token), false);
      assert.equal(state.questions[0].correct, null);
      assert.throws(() => submitVote(room, token, room.questions[0].id, 1), /no longer/);
      assert.throws(() => controlRoom(room, token, "start"), /host/);
      for (const action of ["toggle", "select", "reveal"]) assert.throws(() => controlRoom(room, room.hostToken, action, 1), /Start the questions/);
      controlRoom(room, room.hostToken, "start");
      assert.equal(snapshot(room).started, true);
      assert.equal(snapshot(room).accepting, true);
      assert.throws(() => controlRoom(room, room.hostToken, "start"), /already started/);
      submitVote(room, token, room.questions[0].id, 1);
      rooms.delete(room.code);
    });
    const voted = await request(audience, "room:vote", {
      code,
      token: joined.token,
      questionId: created.state.questions[0].id,
      value: 1,
    });
    assert.equal(voted.ok, true);
    const denied = await request(audience, "room:control", {
      code,
      token: joined.token,
      action: "end",
    });
    assert.equal(denied.ok, false);
    const revealed = new Promise((resolve) =>
      audience.once("room:state", resolve),
    );
    await request(host, "room:control", {
      code,
      token: created.token,
      action: "reveal",
    });
    assert.ok((await revealed).leaderboard[0].score >= 900);
    const restored = await request(audience, "room:join", {
      code,
      name: "Taylor",
      token: joined.token,
    });
    assert.deepEqual(restored.submitted, [created.state.questions[0].id]);
    rooms.delete(code);
  } finally {
    host.disconnect();
    audience.disconnect();
    await new Promise((resolve) => io.close(resolve));
  }
});

test("deletion authorizes every room, removes live and ended rooms, and notifies audiences", async () => {
  const { http, io } = createAppServer();
  await new Promise((resolve) => http.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${http.address().port}`;
  const host = connect(url, { transports: ["websocket"], forceNew: true });
  const audience = connect(url, { transports: ["websocket"], forceNew: true });
  const request = (socket, event, payload) =>
    socket.timeout(3000).emitWithAck(event, payload);
  const createdCodes = [];
  try {
    const first = await request(host, "room:create", {
      title: "Completed",
      questions,
    });
    const firstCredentials = { code: first.state.code, token: first.token };
    createdCodes.push(first.state.code);
    await request(host, "room:control", { ...firstCredentials, action: "end" });
    const second = await request(host, "room:create", {
      title: "Live",
      questions,
    });
    const secondCredentials = { code: second.state.code, token: second.token };
    createdCodes.push(second.state.code);
    const joined = await request(audience, "room:join", {
      code: second.state.code,
      name: "Alex",
    });
    const denied = await request(audience, "room:delete", {
      hostedRooms: [
        firstCredentials,
        { ...secondCredentials, token: joined.token },
      ],
    });
    assert.equal(denied.ok, false);
    assert.equal(rooms.has(first.state.code), true);
    assert.equal(rooms.has(second.state.code), true);
    const notification = new Promise((resolve) =>
      audience.once("room:deleted", resolve),
    );
    const deleted = await request(host, "room:delete", {
      hostedRooms: [firstCredentials, secondCredentials],
    });
    assert.equal(deleted.ok, true);
    assert.deepEqual(await notification, { code: second.state.code });
    assert.equal(rooms.has(first.state.code), false);
    assert.equal(rooms.has(second.state.code), false);
    const rejoin = await request(audience, "room:join", {
      code: second.state.code,
      token: joined.token,
      name: "Alex",
    });
    assert.equal(rejoin.ok, false);
    const retry = await request(host, "room:delete", {
      hostedRooms: [firstCredentials, secondCredentials],
    });
    assert.equal(retry.ok, true);
  } finally {
    createdCodes.forEach((code) => rooms.delete(code));
    host.disconnect();
    audience.disconnect();
    await new Promise((resolve) => io.close(resolve));
  }
});

test("player-made questions: collect one per player, shuffle, credit the author, and never score the author", () => {
  const room = createRoom("Crowd", [], "quiz");
  assert.equal(room.questions.length, 0);
  const alex = joinRoom(room, "Alex");
  const sam = joinRoom(room, "Sam");
  const kim = joinRoom(room, "Kim");
  const mine = (title) => ({ title, options: ["Yes", "No"], correct: 0 });
  assert.throws(() => submitAuthored(room, alex, mine("Too early?")), /host to open/);
  assert.throws(() => controlRoom(room, room.hostToken, "start"), /write their questions first/);
  controlRoom(room, room.hostToken, "collect");
  assert.deepEqual(snapshot(room).crowd.waiting, ["Alex", "Sam", "Kim"]);
  assert.throws(() => controlRoom(room, room.hostToken, "start"), /at least one/);
  assert.throws(() => submitAuthored(room, alex, { title: "", options: ["a", "b"], correct: 0 }), /title/);
  assert.throws(() => submitAuthored(room, alex, { title: "x", options: ["a", "b"], correct: 5 }), /correct/);
  submitAuthored(room, alex, mine("Draft"));
  submitAuthored(room, alex, mine("Alex's question"));
  submitAuthored(room, sam, mine("Sam's question"));
  const before = snapshot(room, true).crowd;
  assert.equal(before.submitted, 2);
  assert.deepEqual(before.waiting, ["Kim"]);
  controlRoom(room, room.hostToken, "start");
  assert.equal(room.started, true);
  const snap = snapshot(room, true);
  assert.deepEqual(snap.questions.map((q) => q.author).sort(), ["Alex", "Sam"]);
  assert.deepEqual(snap.questions.map((q) => q.title).sort(), ["Alex's question", "Sam's question"]);
  assert.throws(() => submitAuthored(room, kim, mine("Late")), /already in play/);
  const authorToken = { Alex: alex, Sam: sam }[room.questions[0].author];
  const otherToken = authorToken === alex ? sam : alex;
  submitVote(room, authorToken, room.questions[0].id, 0);
  submitVote(room, otherToken, room.questions[0].id, 0);
  submitVote(room, kim, room.questions[0].id, 0);
  const scores = Object.fromEntries(snapshot(room, true).leaderboard.map((e) => [e.name, e.score]));
  assert.equal(scores[room.participants.get(authorToken).name], 0);
  assert.ok(scores[room.participants.get(otherToken).name] >= 990);
  assert.ok(scores.Kim >= 990);
  assert.throws(() => createRoom("Bad", [], "slide"), /Choose a question type/);
  rooms.delete(room.code);
});

test("players see their own rank beyond the top 10, and the podium waits on a suspense step", () => {
  const room = createRoom("Crowd", [
    { type: "quiz", title: "Q", options: ["A", "B"], correct: 0 },
  ]);
  const tokens = Array.from({ length: 12 }, (_, index) => joinRoom(room, `P${index}`));
  controlRoom(room, room.hostToken, "start", undefined, 1000);
  tokens.forEach((token, index) => {
    // The first eleven are right; later answers score less.
    submitVote(room, token, room.questions[0].id, index === 11 ? 1 : 0, 2000 + index * 1000);
  });
  controlRoom(room, room.hostToken, "ranking");
  assert.equal(snapshot(room, false, tokens[0]).leaderboard.length, 10);
  assert.equal(snapshot(room, false, tokens[0]).me.rank, 1);
  const last = snapshot(room, false, tokens[11]).me;
  assert.equal(last.rank, 12);
  assert.equal(last.total, 12);
  assert.equal(last.score, 0);
  assert.equal(snapshot(room, true).me, null);
  controlRoom(room, room.hostToken, "suspense");
  let state = snapshot(room);
  assert.equal(state.suspense, true);
  assert.equal(state.podium, false);
  assert.equal(state.ranking, false);
  controlRoom(room, room.hostToken, "podium");
  state = snapshot(room);
  assert.equal(state.suspense, false);
  assert.equal(state.podium, true);
  rooms.delete(room.code);
});

test("resetting a question clears only its responses and reopens it", () => {
  const room = createRoom("Reset", [
    { type: "poll", title: "Hidden?", options: ["A", "B"], revealMode: "onDone" },
    { type: "poll", title: "Other", options: ["A", "B"] },
    { type: "slide", title: "Hi", description: "Welcome", options: [] },
  ]);
  const token = joinRoom(room, "Alex");
  assert.throws(() => controlRoom(room, room.hostToken, "reset"), /Start the questions/);
  controlRoom(room, room.hostToken, "start");
  submitVote(room, token, room.questions[0].id, 0);
  controlRoom(room, room.hostToken, "select", 1);
  submitVote(room, token, room.questions[1].id, 1);
  controlRoom(room, room.hostToken, "select", 0);
  controlRoom(room, room.hostToken, "reveal");
  assert.equal(room.revealed, true);
  assert.throws(() => controlRoom(room, "wrong", "reset"), /Only the host/);
  controlRoom(room, room.hostToken, "reset");
  assert.equal(room.accepting, true);
  assert.equal(room.revealed, false);
  assert.equal(room.votes.get(room.questions[0].id).size, 0);
  assert.equal(room.votes.get(room.questions[1].id).size, 1);
  assert.equal(snapshot(room, true).questions[0].responses, 0);
  submitVote(room, token, room.questions[0].id, 1);
  controlRoom(room, room.hostToken, "select", 2);
  assert.throws(() => controlRoom(room, room.hostToken, "reset"), /no responses/);
  rooms.delete(room.code);
});
