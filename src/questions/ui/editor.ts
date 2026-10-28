import { type ComponentType } from "react";
import { type Question } from "../registry";

/** Props shared by every editor section: the question being edited and its setter. */
export type EditorSectionProps = {
  draft: Question;
  setDraft: (draft: Question) => void;
};

export type EditorSection = ComponentType<EditorSectionProps>;

/** What the host sees when editing a question of one type, beyond the shared fields. */
export type QuestionEditor = {
  /** Replaces the standard title field. */
  Title?: EditorSection;
  /** Type settings, shown after the shared scoring toggles and before the reveal mode. */
  settings?: EditorSection[];
  /** Fields shown after the reveal mode, such as the answer options. */
  fields?: EditorSection[];
  /** Whether the draft has everything this type needs (the title is checked for all). */
  isValid(draft: Question): boolean;
};

/** True when no option is blank. */
export const hasNoBlankOptions = (draft: Question) =>
  draft.options.every((option) => option.trim());
