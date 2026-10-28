import { blankDraft, type QuestionAuthor } from "../../ui/author";
import { TrueFalseFields } from "../../../features/crowd/authorFields";

export const author: QuestionAuthor = {
  blank: () => blankDraft("truefalse", ["True", "False"]),
  titleLabel: "Your true-or-false statement",
  Fields: TrueFalseFields,
};
