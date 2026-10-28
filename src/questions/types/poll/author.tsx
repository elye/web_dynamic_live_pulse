import {
  blankDraft,
  isOptionListValid,
  type QuestionAuthor,
} from "../../ui/author";
import {
  MultipleToggle,
  authorOptionsFields,
} from "../../../features/crowd/authorFields";

const Options = authorOptionsFields({ legend: "Answer options" });

export const author: QuestionAuthor = {
  blank: () => blankDraft("poll", ["", ""]),
  titleLabel: "Your question",
  Fields: (props) => (
    <>
      <MultipleToggle {...props} />
      <Options {...props} />
    </>
  ),
  isValid: isOptionListValid("poll"),
};
