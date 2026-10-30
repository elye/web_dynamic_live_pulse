import type { QuestionDefinition, QuestionRecord } from "./platform/types.ts";
import { cloud } from "./types/cloud/definition.ts";
import { grid2x2 } from "./types/grid2x2/definition.ts";
import { manyoptions } from "./types/manyoptions/definition.ts";
import { peerpraise } from "./types/peerpraise/definition.ts";
import { points100 } from "./types/points100/definition.ts";
import { poll } from "./types/poll/definition.ts";
import { qna } from "./types/qna/definition.ts";
import { quiz } from "./types/quiz/definition.ts";
import { ranking } from "./types/ranking/definition.ts";
import { slide } from "./types/slide/definition.ts";
import { slider } from "./types/slider/definition.ts";
import { text } from "./types/text/definition.ts";
import { truefalse } from "./types/truefalse/definition.ts";
import { twotruths } from "./types/twotruths/definition.ts";
import { match } from "./types/match/definition.ts";

/**
 * Every question type, in the order they are offered. Adding a type to the app means
 * adding its definition here (and its screens to `registry.ui.tsx`); nothing else changes.
 */
const registered = [
  slide,
  cloud,
  poll,
  manyoptions,
  ranking,
  slider,
  qna,
  points100,
  grid2x2,
  peerpraise,
  text,
  quiz,
  truefalse,
  twotruths,
  match,
] as const;

type Registered = (typeof registered)[number];

/** The question types, derived from the registry so it can never drift from it. */
export type Kind = Registered["kind"];

/** A question in any layer: the shared record, with its type narrowed to a known one. */
export type Question = Omit<QuestionRecord, "type"> & { type: Kind };

export const definitions = Object.fromEntries(
  registered.map((definition) => [definition.kind, definition]),
) as { [D in Registered as D["kind"]]: D };

export const kinds: Kind[] = registered.map((definition) => definition.kind);

export function definitionOf(type: Kind): QuestionDefinition;
export function definitionOf(type: string): QuestionDefinition | undefined;
export function definitionOf(type: string): QuestionDefinition | undefined {
  return Object.hasOwn(definitions, type)
    ? definitions[type as Kind]
    : undefined;
}

export function isKind(type: unknown): type is Kind {
  return typeof type === "string" && Object.hasOwn(definitions, type);
}
