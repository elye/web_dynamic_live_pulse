import { type ComponentType } from "react";
import { canCompete, definitionOf, type Kind } from "../index";

/** A question as a player writes it. */
export type Authored = {
  title: string;
  options: string[];
  correct: number | null;
  multiple?: boolean;
  corrects?: number[];
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
};

export type AuthorFieldsProps = {
  draft: Authored;
  setDraft: (draft: Authored) => void;
};

/** How a player writes a question of one type. */
export type QuestionAuthor = {
  /** An empty draft. */
  blank(): Authored;
  /** Label of the title field (unused when the definition fixes the title). */
  titleLabel: string;
  /** The type's own fields, shown under the title. */
  Fields?: ComponentType<AuthorFieldsProps>;
  /** Whether the draft is complete (the title is checked for all). */
  isValid?(draft: Authored): boolean;
};

/** An empty draft: scored types start with the first option correct. */
export function blankDraft(
  kind: Kind,
  options: string[] = [],
  extra: Partial<Authored> = {},
): Authored {
  return {
    title: "",
    options,
    correct: canCompete(kind) ? 0 : null,
    ...extra,
  };
}

/** No option is blank. */
export const allOptionsFilled = (draft: Authored) =>
  draft.options.every((option) => option.trim());

/** Every option is filled in and the count is within the type's rule. */
export const isOptionListValid = (kind: Kind) => (draft: Authored) => {
  const rule = definitionOf(kind).options;
  return (
    allOptionsFilled(draft) &&
    (!rule ||
      (draft.options.length >= rule.min && draft.options.length <= rule.max))
  );
};
