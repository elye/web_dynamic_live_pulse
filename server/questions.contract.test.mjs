import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { buildSystemPrompt } from "../src/aiPrompt.ts";
import { importSession, newSession, serializeSession } from "../src/model.ts";
import {
  aggregateResults,
  createQuestion,
  definitionOf,
  describeAnswer,
  kinds,
  parseAnswer,
  parseQuestion,
  serializeQuestion,
  simulateAnswer,
} from "../src/questions/index.ts";

// These checks run over every registered question type, so a new type is held to the
// same contract automatically the moment it is added to the registry.

const newId = () => "id";
const seeded = () => {
  let state = 7;
  return () => (state = (state * 16807) % 2147483647) / 2147483647;
};
const env = { upvotes: () => 0, targetName: () => "Someone" };

test("the registry lists each type once, with its own definition", () => {
  assert.equal(new Set(kinds).size, kinds.length);
  for (const kind of kinds) assert.equal(definitionOf(kind).kind, kind);
});

for (const kind of kinds) {
  test(`${kind}: created, serialised and parsed back to the same question`, () => {
    const created = createQuestion(kind, newId);
    const exported = serializeQuestion(created);
    const parsed = parseQuestion(exported, { newId });
    assert.deepEqual(serializeQuestion(parsed), exported);
    assert.equal(parsed.type, kind);
  });

  test(`${kind}: simulated answers are accepted, described and totalled`, () => {
    const definition = definitionOf(kind);
    const question = createQuestion(kind, newId);
    if (!definition.traits.collectsAnswers) return;
    const random = seeded();
    const answers = Array.from({ length: 8 }, () => {
      const answer = simulateAnswer(question, random);
      assert.deepEqual(parseAnswer(question, answer), answer);
      assert.ok(describeAnswer(question, answer).length > 0);
      return answer;
    });
    const rows = aggregateResults(
      question,
      answers.map((answer, index) => [`token-${index}`, answer]),
      env,
    );
    assert.ok(Array.isArray(rows));
  });

  test(`${kind}: traits agree with the rest of the definition`, () => {
    const { traits, options } = definitionOf(kind);
    if (traits.scored)
      assert.ok(options, "scored types need options to choose from");
    if (!traits.collectsAnswers) assert.equal(traits.revealMode, false);
    assert.ok(definitionOf(kind).prompt.purpose);
    assert.ok(definitionOf(kind).label);
  });

  test(`${kind}: has every file a question type needs`, () => {
    for (const file of [
      "definition.ts",
      "ui.tsx",
      "results.tsx",
      "input.tsx",
      "editor.tsx",
      "author.tsx",
    ])
      assert.ok(
        existsSync(join("src", "questions", "types", kind, file)),
        `src/questions/types/${kind}/${file} is missing`,
      );
    const { label, hint, tagline } = definitionOf(kind);
    for (const text of [label, hint, tagline]) assert.ok(text.trim());
  });

  test(`${kind}: the AI prompt describes it and every field it exports`, () => {
    const prompt = buildSystemPrompt();
    const { prompt: spec } = definitionOf(kind);
    assert.ok(prompt.includes(`- "${kind}" (`), "missing from the type list");
    assert.ok(prompt.includes(spec.purpose) && prompt.includes(spec.rules));
    const own = Object.keys(serializeQuestion(createQuestion(kind, newId)));
    const universal = ["type", "title", "options", "correct"];
    // revealMode, competitive and showRanking are explained for every type that has them.
    const shared = ["revealMode", "competitive", "showRanking"];
    for (const field of own.filter((name) => !universal.includes(name)))
      assert.ok(
        shared.includes(field) || spec.rules.includes(field),
        `the AI rules for "${kind}" do not mention its field "${field}"`,
      );
  });
}

for (const kind of kinds) {
  test(`${kind}: JSON import rejects a malformed question`, () => {
    const session = JSON.parse(
      serializeSession({
        ...newSession("blank"),
        title: "t",
        questions: [createQuestion(kind, newId)],
      }),
    );
    const attempt = (change) => {
      const copy = structuredClone(session);
      change(copy.questions[0]);
      return () => importSession(JSON.stringify(copy));
    };
    assert.doesNotThrow(attempt(() => {}));
    assert.throws(attempt((question) => (question.type = "nope")));
    const universal = ["type", "title", "options", "correct"];
    for (const field of Object.keys(session.questions[0]))
      if (!universal.includes(field))
        assert.throws(
          attempt((question) => (question[field] = { invalid: true })),
          undefined,
          `"${kind}" accepts a malformed "${field}"`,
        );
  });
}

test("the AI prompt's example holds one valid question of every type", () => {
  const prompt = buildSystemPrompt();
  const marker = "follow the structure):\n";
  const example = prompt.slice(prompt.indexOf(marker) + marker.length);
  const session = importSession(example);
  assert.deepEqual(
    session.questions.map((question) => question.type),
    kinds,
  );
});

// A scaffolded type (npm run new:question) is not finished until its TODOs are resolved.
test("no scaffold TODO(new-question) markers remain", () => {
  const left = [];
  const walk = (directory) => {
    for (const name of readdirSync(directory)) {
      const path = join(directory, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (readFileSync(path, "utf8").includes("TODO(new-question)"))
        left.push(path);
    }
  };
  walk(join("src", "questions"));
  assert.deepEqual(left, []);
});

// Question-type knowledge belongs in src/questions. Everything else asks the registry.
test("no code outside src/questions branches on a question type", () => {
  const literal = kinds.join("|");
  const pattern = new RegExp(
    `(?:type|kind)\\s*(?:===|!==)\\s*"(?:${literal})"|case "(?:${literal})"|\\[\\s*"(?:${literal})"\\s*,\\s*"(?:${literal})"`,
  );
  const offenders = [];
  const walk = (directory) => {
    for (const name of readdirSync(directory)) {
      const path = join(directory, name);
      if (statSync(path).isDirectory()) {
        if (path !== join("src", "questions")) walk(path);
      } else if (
        /\.(ts|tsx|mjs)$/.test(name) &&
        !name.includes(".test.") &&
        pattern.test(readFileSync(path, "utf8"))
      )
        offenders.push(path);
    }
  };
  walk("src");
  walk("server");
  assert.deepEqual(offenders, []);
});
