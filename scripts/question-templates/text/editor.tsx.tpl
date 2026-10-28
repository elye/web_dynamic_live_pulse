import type { QuestionEditor } from "../../ui/editor";

// TODO(new-question): add `settings` / `fields` sections for any field this type adds, and
// make isValid reject drafts that definition.ts would refuse on import.
export const editor: QuestionEditor = { isValid: () => true };
