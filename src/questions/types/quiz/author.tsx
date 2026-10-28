import {
  blankDraft,
  isOptionListValid,
  type QuestionAuthor,
} from "../../ui/author";
import {
  MultipleToggle,
  authorOptionsFields,
} from "../../../features/crowd/authorFields";

const Options = authorOptionsFields({
  legend: "Answer options",
  hasCorrect: true,
  multipleCorrect: true,
});
const optionsValid = isOptionListValid("quiz");

export const author: QuestionAuthor = {
  blank: () => blankDraft("quiz", ["", ""]),
  titleLabel: "Your question",
  Fields: (props) => (
    <>
      <MultipleToggle {...props} />
      <Options {...props} />
    </>
  ),
  isValid: (draft) =>
    optionsValid(draft) &&
    !(draft.multiple === true && !(draft.corrects ?? []).length),
};
