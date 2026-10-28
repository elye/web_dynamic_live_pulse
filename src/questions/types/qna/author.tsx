import { blankDraft, type QuestionAuthor } from "../../ui/author";

export const author: QuestionAuthor = {
  blank: () => blankDraft("qna"),
  titleLabel: "Your question",
};
