import { blankDraft, type QuestionAuthor } from "../../ui/author";

export const author: QuestionAuthor = {
  blank: () => blankDraft("text"),
  titleLabel: "Your question",
};
