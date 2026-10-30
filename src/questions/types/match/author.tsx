import { blankDraft, type QuestionAuthor } from "../../ui/author";

export const author: QuestionAuthor = {
  blank: () => blankDraft("match", ["", ""]),
  titleLabel: "Your question",
  isValid: () => false,
};
