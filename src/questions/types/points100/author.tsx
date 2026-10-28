import {
  blankDraft,
  isOptionListValid,
  type QuestionAuthor,
} from "../../ui/author";
import { authorOptionsFields } from "../../../features/crowd/authorFields";

export const author: QuestionAuthor = {
  blank: () => blankDraft("points100", ["", ""]),
  titleLabel: "Your question",
  Fields: authorOptionsFields({ legend: "Options to allocate points across" }),
  isValid: isOptionListValid("points100"),
};
