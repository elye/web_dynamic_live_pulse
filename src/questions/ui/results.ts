import { type ComponentType } from "react";
import { type Question, type ResultRow } from "../index";

export type ResultsViewProps = {
  question: Question;
  results: ResultRow[];
  total: number;
  reveal: boolean;
  fit: boolean;
  preview: boolean;
  onUpvote?: (entrantId: string) => void;
  upvotedIds?: Set<string>;
};

export type ConcealedViewProps = {
  question: Question;
  results: ResultRow[];
  fit: boolean;
};

/** How a question type shows its responses on the stage and in the results. */
export type QuestionResults = {
  Results: ComponentType<ResultsViewProps>;
  /** What stays on the stage while responses are hidden (the options, or the axes / range). */
  Concealed?: ComponentType<ConcealedViewProps>;
  /** Sample responses for thumbnails and the editor canvas. */
  previewRows(question: Question): ResultRow[];
  /** The rows before anyone has answered; defaults to the options with no votes. */
  blankRows?(question: Question): ResultRow[];
  /** Shown when nothing has arrived yet. Without it the results render even when empty. */
  emptyText?: string;
  /** Overrides the sum of the counts. */
  total?(question: Question, rows: ResultRow[], preview: boolean): number;
};
