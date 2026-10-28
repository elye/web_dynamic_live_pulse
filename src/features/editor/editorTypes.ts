import { type Question } from "../../model";
import { editorOf } from "../../questions/ui/editorRegistry";

export type { EditorSectionProps } from "../../questions/ui/editor";

/** Whether the draft has everything required to be saved. */
export function isDraftSavable(draft: Question) {
  return !!draft.title.trim() && editorOf(draft.type).isValid(draft);
}
