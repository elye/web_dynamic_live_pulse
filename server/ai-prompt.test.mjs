import { test } from "node:test";
import assert from "node:assert/strict";
import { labels, importSession, serializeSession } from "../src/model.ts";
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
  const json = prompt.slice(
    prompt.lastIndexOf('{\n  "format": "pulse-session"'),
  );
  const session = importSession(json);
  assert.equal(session.questions.length, allKinds.length);
  const peerpraise = session.questions.find(
    (question) => question.type === "peerpraise",
  );
  assert.equal(peerpraise?.revealMode, "onDone");
  assert.equal(peerpraise?.correct, null);
  assert.deepEqual(peerpraise?.options, []);
  const exported = serializeSession(session);
  const restored = importSession(exported);
  assert.equal(
    restored.questions.find((question) => question.type === "peerpraise")
      ?.revealMode,
    "onDone",
  );
});

test("AI prompt explains surveys vs quizzes and every type is classified", () => {
  const prompt = buildSystemPrompt();
  assert.ok(prompt.includes("SURVEY vs QUIZ"));
  const { survey, quiz } = kindCategories();
  assert.deepEqual([...survey, ...quiz, "slide"].sort(), [...allKinds].sort());
  for (const kind of quiz) {
    assert.ok(prompt.includes(`"${kind}"`));
    assert.ok(
      prompt.includes(
        `For scored types (${quiz.map((k) => `"${k}"`).join(", ")})`,
      ),
    );
  }
  assert.ok(promptExamples.length > 0);
  for (const example of promptExamples)
    assert.ok(example.id && example.label && example.hint && example.text);
});

test("clipboard prompt appends the user's request", () => {
  const text = buildClipboardPrompt("  A quiz about space  ");
  assert.ok(text.includes("USER REQUEST\nA quiz about space\n"));
});
