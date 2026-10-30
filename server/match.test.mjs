import { test } from "node:test";
import assert from "node:assert/strict";
import {
  controlRoom,
  createRoom,
  joinRoom,
  rooms,
  scoreAnswer,
  snapshot,
  submitVote,
} from "./rooms.mjs";

const pairs = {
  type: "match",
  title: "Match",
  options: ["Ada", "Albert", "Katherine", "Alan"],
  matchOptions: ["1815", "1879", "1918", "1912"],
  correct: null,
};

test("match: the jumble starts with no pair together and stays hidden until the reveal", () => {
  const room = createRoom("Match", [pairs]);
  const [question] = room.questions;
  assert.equal(question.matchShuffle.length, 4);
  question.matchShuffle.forEach((pair, position) =>
    assert.notEqual(pair, position),
  );
  const token = joinRoom(room, "Avery");
  controlRoom(room, room.hostToken, "start");

  // Players get list B in jumbled order and nothing that reveals the pairs.
  const hidden = snapshot(room, false, token).questions[0];
  assert.equal(hidden.matchShuffle, undefined);
  assert.deepEqual(
    hidden.matchOptions,
    question.matchShuffle.map((pair) => pairs.matchOptions[pair]),
  );
  assert.deepEqual(snapshot(room, true).questions[0].matchOptions, [
    "1815",
    "1879",
    "1918",
    "1912",
  ]);

  // Placing every right item beside its partner earns full marks; the starting order earns none.
  const inverse = question.matchShuffle.map((_, row) =>
    question.matchShuffle.indexOf(row),
  );
  submitVote(room, token, question.id, inverse);
  assert.equal(scoreAnswer(room, question, token) > 0, true);
  const half = [...inverse];
  [half[2], half[3]] = [half[3], half[2]];
  const other = joinRoom(room, "Blake");
  submitVote(room, other, question.id, half);
  assert.deepEqual(
    snapshot(room, true).questions[0].results.map((row) => row.count),
    [2, 2, 1, 1],
  );
  assert.equal(snapshot(room, true).questions[0].responses, 2);

  controlRoom(room, room.hostToken, "reveal");
  const revealed = snapshot(room, false, token).questions[0];
  assert.deepEqual(revealed.matchOptions, pairs.matchOptions);
  assert.deepEqual(revealed.matchShuffle, question.matchShuffle);
  rooms.delete(room.code);
});
