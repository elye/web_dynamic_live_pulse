import type {
  Answer,
  QuestionDefinition,
  QuestionRecord,
  ResultRow,
  Traits,
} from "./types.ts";

export const baseTraits: Traits = {
  collectsAnswers: true,
  scored: false,
  revealMode: true,
  defaultRevealMode: "live",
  resultsAlwaysVisible: false,
  playerAuthorable: true,
  assignsTargets: false,
  upvotes: false,
  optionsVisibleWhenHidden: false,
  frameVisibleWhenHidden: false,
};

/**
 * The one way to declare a question type. It fills in the usual traits so a definition only
 * lists what makes it different, and keeps the literal `kind` so the registry can derive `Kind`.
 */
export function defineQuestion<const K extends string>(
  definition: Omit<QuestionDefinition<K>, "traits"> & {
    traits?: Partial<Traits>;
  },
): QuestionDefinition<K> {
  return { ...definition, traits: { ...baseTraits, ...definition.traits } };
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

export const isIndex = (value: unknown, length: number): value is number =>
  Number.isInteger(value) &&
  (value as number) >= 0 &&
  (value as number) < length;

/** The optional "participants may pick several options" switch. */
export function parseMultiple(value: unknown): boolean {
  if (value !== undefined && typeof value !== "boolean")
    throw new Error("Multiple must be true or false.");
  return value === true;
}

/** A one-line answer of at most `max` characters, trimmed. */
export function parseText(value: unknown, max: number): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new Error("Enter a response within the character limit.");
  return value.trim();
}

/** Counts how many answers picked each option (an answer may hold several). */
export function tallyChoices(labels: string[], values: unknown[]): ResultRow[] {
  return labels.map((text, index) => ({
    text,
    count: values.filter((value) =>
      Array.isArray(value) ? value.includes(index) : value === index,
    ).length,
  }));
}

/** Counts identical answers, most common first. */
export function tallyText(
  values: unknown[],
  normalise: (value: string) => string = (value) => value,
): ResultRow[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    const key = normalise(value as string);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts]
    .map(([text, count]) => ({ text, count }))
    .sort((first, second) => second.count - first.count);
}

/** "A. Jupiter" for the option at `index`. */
export const letteredOption = (question: QuestionRecord, index: number) =>
  `${String.fromCharCode(65 + index)}. ${question.options[index] ?? ""}`;

/** Describes a single or multiple option pick with letters, e.g. "A. Jupiter · C. Mars". */
export function describeLetters(question: QuestionRecord, answer: Answer) {
  if (Array.isArray(answer))
    return (answer as number[])
      .map((index) => letteredOption(question, index))
      .join(" · ");
  if (typeof answer === "number") return letteredOption(question, answer);
  return typeof answer === "string" ? answer : "";
}

export const sortedUnique = (indexes: number[]) =>
  [...new Set(indexes)].sort((first, second) => first - second);

export function shuffled<T>(random: () => number, items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

export const pick = <T>(random: () => number, items: readonly T[]): T =>
  items[Math.floor(random() * items.length)];
