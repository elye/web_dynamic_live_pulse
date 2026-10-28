import { hasNoBlankOptions, type QuestionEditor } from "../../ui/editor";
import { optionsSection } from "../../../features/editor/sections/OptionsEditor";

export const editor: QuestionEditor = {
  fields: [optionsSection({ legend: "Items to rank" })],
  isValid: hasNoBlankOptions,
};
