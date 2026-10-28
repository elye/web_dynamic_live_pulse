import { hasNoBlankOptions, type QuestionEditor } from "../../ui/editor";
import { optionsSection } from "../../../features/editor/sections/OptionsEditor";

export const editor: QuestionEditor = {
  fields: [
    optionsSection({
      legend: "Two truths and one lie",
      correctName: "the lie",
      correctLabel: "the lie",
      placeholder: (isLie) => (isLie ? "The lie" : "A true statement"),
    }),
  ],
  isValid: hasNoBlankOptions,
};
