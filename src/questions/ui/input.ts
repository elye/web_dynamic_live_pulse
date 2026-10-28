import { type ComponentType } from "react";
import { type Answer } from "../platform/types.ts";
import { type Question } from "../registry";

/** What the player's form holds before it is sent; the shape depends on the question type. */
export type AnswerValue = string | number | number[] | { x: number; y: number };

type InputBase = {
  /**
   * The value the form stands for right now, given what the player has touched so far
   * (an untouched slider sits in the middle, an untouched ranking in option order).
   * Without it the touched value is used as is.
   */
  resolve?(question: Question, touched: AnswerValue): AnswerValue | null;
  /** Whether the resolved value can be sent. Without it any non-blank value can. */
  isReady?(question: Question, value: AnswerValue | null): boolean;
  /** What to remember as the player's answer after sending, for types that take several. */
  remember?(previous: Answer | undefined, value: AnswerValue | null): Answer;
  /** The form empties once sent, ready for another submission. */
  clearsAfterSubmit?: boolean;
  /** The answer is an array of separate answers, not one answer that happens to be a list. */
  listsAnswers?: boolean;
  /** Said before the correct answer when the results are shown. */
  correctAnswerLabel?: string;
  /** Extra lines under the title on the player's screen. */
  Header?: ComponentType;
};

/** How a player answers a question type on their own device. */
export type QuestionInput = InputBase &
  (
    | { /** The form fields. */ Input: ComponentType; Screen?: undefined }
    | {
        /** Replaces the whole answering flow, for types with nothing to submit. */
        Screen: ComponentType;
        Input?: undefined;
      }
  );

export const isBlank = (value: AnswerValue | null) =>
  value === "" || (typeof value === "string" && !value.trim());

export function answerReady(
  input: QuestionInput,
  question: Question,
  value: AnswerValue | null,
) {
  return input.isReady ? input.isReady(question, value) : !isBlank(value);
}
