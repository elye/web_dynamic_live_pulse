import { definitionOf, kinds, type Kind, type Question } from "../registry.ts";
import { baseTraits, isIndex, isRecord } from "./define.ts";
import type {
  Answer,
  QuestionDefinition,
  QuestionRecord,
  RawQuestion,
  ResultRow,
  ResultsEnv,
  RevealMode,
} from "./types.ts";

/**
 * The platform's operations. Each one looks the question's type up in the registry and
 * hands over to its definition, so none of them changes when a type is added.
 */

export type ParseEnv = {
  newId(): string;
  /** Store values in the form a live room keeps, e.g. lowercase colours. */
  canonical?: boolean;
};

const revealModes: RevealMode[] = ["live", "onDone"];

const guardedSettings = new Set(
  kinds.flatMap((kind) => definitionOf(kind).settings ?? []),
);

/** What the platform may do with a type; unknown types have no traits. */
export const traitsOf = (type: string) =>
  definitionOf(type)?.traits ?? baseTraits;
export const hasRevealMode = (type: string) => traitsOf(type).revealMode;
/** Only questions with a correct answer can be scored and ranked. */
export const canCompete = (type: string) => traitsOf(type).scored;
export const defaultRevealMode = (type: string) =>
  traitsOf(type).defaultRevealMode;

function parseOptions(definition: QuestionDefinition, input: unknown) {
  if (
    input !== undefined &&
    (!Array.isArray(input) ||
      input.some((option) => typeof option !== "string"))
  )
    throw new Error("Options must be a list of text.");
  const options = ((input ?? []) as string[]).map((option) => option.trim());
  const rule = definition.options;
  if (!rule) {
    if (options.length)
      throw new Error("This question type must have empty options.");
    return options;
  }
  if (
    options.length < rule.min ||
    options.length > rule.max ||
    options.some((option) => !option || option.length > rule.maxLength)
  )
    throw new Error(rule.message);
  return options;
}

/** Turns untrusted input into a question, or throws a message saying what is wrong. */
export function parseQuestion(raw: unknown, env: ParseEnv): Question {
  if (!isRecord(raw)) throw new Error("Expected a question object.");
  const definition = definitionOf(String(raw.type));
  if (!definition) throw new Error("Unsupported question type.");
  const { traits } = definition;
  let title = definition.fixedTitle;
  if (title === undefined) {
    if (
      typeof raw.title !== "string" ||
      !raw.title.trim() ||
      raw.title.length > 200
    )
      throw new Error("Each question needs a title (up to 200 characters).");
    title = raw.title.trim();
  }
  const options = parseOptions(definition, raw.options);
  for (const key of guardedSettings)
    if (
      !definition.settings?.includes(key) &&
      raw[key] !== undefined &&
      raw[key] !== false
    )
      throw new Error(`${definition.label} questions cannot set ${key}.`);
  const { correct: taken, ...fields } =
    definition.parse?.(raw, { options, canonical: env.canonical === true }) ??
    {};
  if (
    traits.revealMode &&
    raw.revealMode !== undefined &&
    !(revealModes as unknown[]).includes(raw.revealMode)
  )
    throw new Error('Reveal mode must be "live" or "onDone".');
  if (
    raw.competitive !== undefined &&
    (typeof raw.competitive !== "boolean" ||
      (raw.competitive && !traits.scored))
  )
    throw new Error(
      "Only quiz, true-or-false and two-truths questions can be competitive.",
    );
  if (raw.showRanking !== undefined && typeof raw.showRanking !== "boolean")
    throw new Error("Show ranking must be true or false.");
  let correct: number | null = null;
  if (taken !== undefined) correct = taken;
  else if (traits.scored) {
    if (!isIndex(raw.correct, options.length))
      throw new Error(
        "Choose the correct answer: correct must be a valid zero-based option index.",
      );
    correct = raw.correct;
  }
  return {
    id: env.newId(),
    type: definition.kind as Kind,
    title,
    ...fields,
    ...(traits.revealMode
      ? {
          revealMode:
            (raw.revealMode as RevealMode) ?? traits.defaultRevealMode,
        }
      : {}),
    ...(traits.scored
      ? {
          competitive: raw.competitive !== false,
          showRanking: raw.showRanking !== false,
        }
      : {}),
    options,
    correct,
  };
}

/** The question as an export file holds it: only what the host set, no ids or results. */
export function serializeQuestion(question: QuestionRecord): RawQuestion {
  const definition = definitionOf(question.type)!;
  const { traits } = definition;
  return {
    type: question.type,
    title: question.title,
    options: question.options,
    correct: question.correct,
    ...definition.serialize?.(question),
    ...(traits.scored
      ? {
          competitive: question.competitive !== false,
          showRanking: question.showRanking !== false,
        }
      : {}),
    ...(traits.revealMode
      ? { revealMode: question.revealMode ?? traits.defaultRevealMode }
      : {}),
  };
}

/** The fields a player's copy of the question must not carry before the reveal. */
export function concealedFields(question: QuestionRecord) {
  return definitionOf(question.type)?.conceal?.(question) ?? {};
}

/** A fresh question of `kind` with its example content. */
export function createQuestion(kind: Kind, newId: () => string): Question {
  const definition = definitionOf(kind);
  const { traits } = definition;
  return {
    id: newId(),
    type: kind,
    ...(traits.revealMode ? { revealMode: traits.defaultRevealMode } : {}),
    ...(traits.scored ? { competitive: true, showRanking: true } : {}),
    ...definition.create(),
  };
}

/** The question a player's own form describes, ready for `parseQuestion`. */
export function authoredQuestion(
  kind: Kind,
  input: Record<string, unknown>,
): RawQuestion {
  return {
    type: kind,
    title: input.title,
    ...definitionOf(kind).author?.toRaw(input),
  };
}

/** Checks one submission against its question and returns the value to store. */
export function parseAnswer(question: QuestionRecord, value: unknown): Answer {
  return definitionOf(question.type)!.answer.parse(question, value);
}

/** How many submissions one player may make (more than one only for word clouds). */
export function submissionLimit(question: QuestionRecord) {
  return definitionOf(question.type)?.answer.limit?.(question) ?? 1;
}

export const holdsSeveralSubmissions = (question: QuestionRecord) =>
  !!definitionOf(question.type)?.answer.limit;

/** How many submissions a stored answer stands for. */
export function submissionCount(question: QuestionRecord, stored: unknown) {
  return holdsSeveralSubmissions(question) && Array.isArray(stored)
    ? stored.length
    : 1;
}

/** Words for what a player sent, e.g. the options they ticked. */
export function describeAnswer(
  question: QuestionRecord,
  answer: Answer | undefined,
) {
  if (answer === undefined || answer === null || answer === "") return "";
  return definitionOf(question.type)!.answer.describe(question, answer);
}

/** A plausible answer for load testing, or null when the question takes no response. */
export function simulateAnswer(question: QuestionRecord, random: () => number) {
  return definitionOf(question.type)!.answer.simulate(question, random);
}

/** The share (0 to 1) of the question's points an answer earns. */
export function scoreShare(question: QuestionRecord, answer: unknown) {
  const definition = definitionOf(question.type)!;
  if (definition.score) return definition.score(question, answer);
  return answer === question.correct ? 1 : 0;
}

/** Totals the stored answers of one question into the rows its results show. */
export function aggregateResults(
  question: QuestionRecord,
  entries: Iterable<[string, unknown]>,
  env: Pick<ResultsEnv, "upvotes" | "targetName">,
): ResultRow[] {
  const definition = definitionOf(question.type)!;
  const tokens: string[] = [];
  const values: unknown[] = [];
  for (const [token, stored] of entries)
    for (const value of definition.answer.limit && Array.isArray(stored)
      ? stored
      : [stored]) {
      tokens.push(token);
      values.push(value);
    }
  return definition.results.aggregate(question, values, { ...env, tokens });
}
