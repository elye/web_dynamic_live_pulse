import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createRoom,
  controlRoom,
  joinRoom,
  rooms,
  snapshot,
  submitVote,
} from "./rooms.mjs";
import {
  parseSimulatedPlayers,
  simulatedAnswer,
  startSimulation,
} from "./simulation.mjs";
import { createAppServer } from "./index.mjs";
import { io as connect } from "socket.io-client";

const questions = [
  {
    type: "quiz",
    title: "Which one?",
    options: ["First", "Second"],
    correct: 1,
  },
  { type: "poll", title: "Many?", options: ["A", "B", "C"], multiple: true },
  { type: "ranking", title: "Rank", options: ["A", "B", "C"] },
  { type: "points100", title: "Points", options: ["A", "B", "C"] },
  {
    type: "slider",
    title: "Slide",
    options: [],
    sliderMin: 0,
    sliderMax: 10,
    sliderStep: 0.5,
  },
  { type: "grid2x2", title: "Grid", options: ["a", "b", "c", "d"] },
  { type: "cloud", title: "Words", options: [], maxSubmissions: 3 },
  { type: "text", title: "Say", options: [] },
  { type: "peerpraise", title: "Praise", options: [] },
  { type: "qna", title: "Ask", options: [] },
];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const fast = { interval: 5, joinWindow: 100, answerWindow: 100 };

test("simulated players are validated", () => {
  assert.equal(parseSimulatedPlayers(300), 300);
  for (const bad of [0, 301, 1.5, "10", undefined, null])
    assert.throws(() => parseSimulatedPlayers(bad), /between 1 and 300/);
});

test("every question type gets an answer the room accepts", () => {
  const room = createRoom("Answers", questions);
  const token = joinRoom(room, "Sim");
  controlRoom(room, room.hostToken, "start");
  room.questions.forEach((question, index) => {
    controlRoom(room, room.hostToken, "select", index);
    for (let attempt = 0; attempt < 50; attempt++) {
      const answer = simulatedAnswer(question);
      room.votes.get(question.id).delete(token);
      submitVote(room, token, question.id, answer);
    }
  });
  rooms.delete(room.code);
});

test("players join over the window, flagged as simulated, and answer every question", async () => {
  const room = createRoom("Rehearsal", questions);
  const changes = [];
  const simulation = startSimulation(room, 40, {
    ...fast,
    onChange: () => changes.push(room.participants.size),
  });
  try {
    assert.equal(room.participants.size, 0);
    controlRoom(room, room.hostToken, "start");
    await wait(300);
    assert.equal(room.participants.size, 40);
    assert.ok(
      [...room.participants.values()].every((member) => member.simulated),
    );
    assert.equal(
      new Set([...room.participants.values()].map((m) => m.name)).size,
      40,
    );
    assert.ok(
      changes.some((count) => count > 0 && count < 40),
      "joins are spread out",
    );
    for (let index = 0; index < room.questions.length; index++) {
      if (index) controlRoom(room, room.hostToken, "select", index);
      await wait(index === 6 ? 1500 : 800);
      const question = room.questions[index];
      const votes = room.votes.get(question.id);
      const answered =
        question.type === "cloud"
          ? [...votes.values()].reduce((sum, words) => sum + words.length, 0)
          : votes.size;
      assert.ok(answered >= 40, `${question.type}: ${answered}`);
    }
    assert.equal(snapshot(room, true).participants, 40);
  } finally {
    simulation.stop();
    rooms.delete(room.code);
  }
});

test("real players share the room with simulated ones", async () => {
  const room = createRoom("Mixed", questions);
  const simulation = startSimulation(room, 10, fast);
  try {
    const real = joinRoom(room, "Real Rita");
    controlRoom(room, room.hostToken, "start");
    await wait(300);
    assert.equal(room.participants.size, 11);
    assert.equal(room.participants.get(real).simulated, undefined);
    assert.equal(room.votes.get(room.questions[0].id).has(real), false);
  } finally {
    simulation.stop();
    rooms.delete(room.code);
  }
});

test("nothing is answered while paused, and the simulation stops when the room ends", async () => {
  const room = createRoom("Pause", questions);
  const simulation = startSimulation(room, 5, fast);
  try {
    await wait(200);
    controlRoom(room, room.hostToken, "start");
    controlRoom(room, room.hostToken, "toggle");
    await wait(300);
    assert.equal(room.votes.get(room.questions[0].id).size, 0);
    controlRoom(room, room.hostToken, "toggle");
    await wait(800);
    assert.equal(room.votes.get(room.questions[0].id).size, 5);
    controlRoom(room, room.hostToken, "end");
    const size = room.participants.size;
    await wait(50);
    assert.equal(room.participants.size, size);
  } finally {
    simulation.stop();
    rooms.delete(room.code);
  }
});

test("simulation is requested over the socket and stays off by default", async () => {
  const { http } = createAppServer();
  await new Promise((resolve) => http.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${http.address().port}`;
  const host = connect(url, { transports: ["websocket"], forceNew: true });
  const send = (event, payload) =>
    host.timeout(3000).emitWithAck(event, payload);
  try {
    assert.equal(
      (
        await send("room:create", {
          title: "Bad",
          questions,
          simulation: { players: 999 },
        })
      ).ok,
      false,
    );
    assert.equal(
      (
        await send("room:create", {
          title: "Crowd",
          questions: [],
          crowdKind: "poll",
          simulation: { players: 5 },
        })
      ).ok,
      false,
    );
    const plain = await send("room:create", { title: "Plain", questions });
    await wait(300);
    assert.equal(rooms.get(plain.state.code).participants.size, 0);
    const created = await send("room:create", {
      title: "Sim",
      questions,
      simulation: { players: 3 },
    });
    assert.equal(created.ok, true);
    await wait(10_500);
    assert.equal(rooms.get(created.state.code).participants.size, 3);
  } finally {
    host.disconnect();
    await new Promise((resolve) => http.close(resolve));
  }
});
