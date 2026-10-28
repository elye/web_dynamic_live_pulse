import { GridAxisEditor } from "../../../features/editor/sections/GridAxisEditor";
import { hasNoBlankOptions, type QuestionEditor } from "../../ui/editor";

export const editor: QuestionEditor = {
  fields: [GridAxisEditor],
  isValid: hasNoBlankOptions,
};
