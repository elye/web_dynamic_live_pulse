import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createRoom,
  joinRoom,
  submitVote,
  submitUpvote,
  controlRoom,
  snapshot,
  rooms,
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

test("reveal mode defaults to onDone, hides results until reveal, and shows live results on the fly", () => {
  const room = createRoom("Modes", [
    { type: "poll", title: "Hidden?", options: ["A", "B"] },
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
  assert.equal(snapshot(room).leaderboard[0].score, 1000);
  assert.throws(
    () => submitVote(room, joinRoom(room, "Sam"), room.questions[0].id, 0),
    /no longer/,
  );
  rooms.delete(room.code);
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
  assert.equal(snapshot(room).leaderboard[0].score, 1000);
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
    const joined = await request(audience, "room:join", {
      code,
      name: "Taylor",
    });
    assert.equal(joined.state.questions[0].correct, null);
    assert.equal(joined.state.started, false);
    assert.deepEqual(joined.state.participantNames, ["Taylor"]);
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
    assert.equal((await revealed).leaderboard[0].score, 1000);
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
