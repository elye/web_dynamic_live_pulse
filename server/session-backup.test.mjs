import { test } from "node:test";
import assert from "node:assert/strict";
import { importSession, newSession, serializeSession } from "../src/model.ts";

test("session JSON round-trips all question types without credentials, results, or IDs", () => {
  const original = newSession();
  original.theme = "peach";
  original.hostedRooms = [{ code: "123456", token: "private-host-token" }];
  original.questions[0].results = [{ text: "private response", count: 1 }];
  const json = serializeSession(original);
  for (const secret of [
    original.id,
    original.questions[0].id,
    "private-host-token",
    "private response",
    "123456",
  ])
    assert.equal(json.includes(secret), false);
  const restored = importSession(json);
  assert.equal(serializeSession(restored), json);
  assert.notEqual(restored.id, original.id);
  assert.notEqual(restored.questions[0].id, original.questions[0].id);
  assert.equal(restored.hostedRooms, undefined);
  assert.equal(restored.questions[2].correct, 1);
});

test("malformed and invalid backups are rejected without partial imports", () => {
  assert.throws(() => importSession("{"), /Invalid JSON/);
  assert.throws(() => importSession("null"), /object/);
  assert.throws(() => importSession(" ".repeat(128 * 1024 + 1)), /128 KB/);
  const valid = JSON.parse(serializeSession(newSession()));
  const invalid = [
    [{ ...valid, version: 2 }, /version 1/],
    [{ ...valid, title: " " }, /title/],
    [{ ...valid, theme: "unknown" }, /theme/],
    [{ ...valid, questions: [] }, /1 to 30/],
    [{ ...valid, questions: Array(31).fill(valid.questions[0]) }, /1 to 30/],
    [
      { ...valid, questions: [{ ...valid.questions[0], type: "bad" }] },
      /unsupported/,
    ],
    [
      { ...valid, questions: [{ ...valid.questions[1], options: ["", "A"] }] },
      /nonempty/,
    ],
    [
      { ...valid, questions: [{ ...valid.questions[2], correct: 7 }] },
      /zero-based/,
    ],
    [
      { ...valid, questions: [{ ...valid.questions[0], options: ["A"] }] },
      /empty options/,
    ],
  ];
  for (const [input, message] of invalid)
    assert.throws(() => importSession(JSON.stringify(input)), message);
});
