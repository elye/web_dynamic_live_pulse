import { authorOptionsFields } from "../../../features/crowd/authorFields";
import {
  blankDraft,
  isOptionListValid,
  type QuestionAuthor,
} from "../../ui/author";

const Options = authorOptionsFields({ legend: "Answer options" });

// TODO(new-question): player-made questions. Used only when the definition sets
// traits.playerAuthorable; add Fields / isValid for any extra inputs.
export const author: QuestionAuthor = {
  blank: () => blankDraft("__KIND__", ["", ""]),
  titleLabel: "Your question",
  Fields: (props) => <Options {...props} />,
  isValid: isOptionListValid("__KIND__"),
};
