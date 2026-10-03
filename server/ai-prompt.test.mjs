import { test } from "node:test";
import assert from "node:assert/strict";
import { labels, importSession } from "../src/model.ts";
import {
  allKinds,
  buildClipboardPrompt,
  buildSystemPrompt,
  kindCategories,
  promptExamples,
  slideSpecs,
} from "../src/aiPrompt.ts";

test("AI system prompt documents every slide type", () => {
  const prompt = buildSystemPrompt();
  for (const kind of Object.keys(labels)) {
    assert.ok(slideSpecs[kind], `aiPrompt.ts is missing a spec for "${kind}"`);
    assert.ok(prompt.includes(`- "${kind}"`), `prompt omits "${kind}"`);
  }
  assert.deepEqual([...allKinds].sort(), Object.keys(slideSpecs).sort());
});

test("the example JSON embedded in the AI prompt is importable", () => {
  const prompt = buildSystemPrompt();
  const json = prompt.slice(prompt.lastIndexOf('{\n  "format": "pulse-session"'));
  const session = importSession(json);
  assert.equal(session.questions.length, allKinds.length);
});

test("AI prompt explains surveys vs quizzes and every type is classified", () => {
  const prompt = buildSystemPrompt();
  assert.ok(prompt.includes("SURVEY vs QUIZ"));
  const { survey, quiz } = kindCategories();
  assert.deepEqual(
    [...survey, ...quiz, "slide"].sort(),
    [...allKinds].sort(),
  );
  assert.deepEqual(quiz.sort(), ["quiz", "truefalse", "twotruths"]);
  assert.equal(promptExamples.length, 3);
});

test("clipboard prompt appends the user's request", () => {
  const text = buildClipboardPrompt("  A quiz about space  ");
  assert.ok(text.includes("USER REQUEST\nA quiz about space\n"));
});
