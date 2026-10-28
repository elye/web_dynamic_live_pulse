import { blankDraft, type QuestionAuthor } from "../../ui/author";

// TODO(new-question): player-made questions. Used only when the definition sets
// traits.playerAuthorable; add Fields / isValid for any extra inputs.
export const author: QuestionAuthor = {
  blank: () => blankDraft("__KIND__"),
  titleLabel: "Your question",
};
