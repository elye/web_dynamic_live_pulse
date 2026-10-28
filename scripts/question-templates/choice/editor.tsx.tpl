import { optionsSection } from "../../../features/editor/sections/OptionsEditor";
import { hasNoBlankOptions, type QuestionEditor } from "../../ui/editor";

// TODO(new-question): add `settings` sections for any field this type adds, and make
// isValid reject drafts that definition.ts would refuse on import.
export const editor: QuestionEditor = {
  fields: [optionsSection({ legend: "Answer options" })],
  isValid: hasNoBlankOptions,
};
