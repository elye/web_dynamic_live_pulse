import {
  blankDraft,
  isOptionListValid,
  type QuestionAuthor,
} from "../../ui/author";
import { authorOptionsFields } from "../../../features/crowd/authorFields";

export const author: QuestionAuthor = {
  blank: () => blankDraft("ranking", ["", ""]),
  titleLabel: "Your question",
  Fields: authorOptionsFields({ legend: "Items to rank" }),
  isValid: isOptionListValid("ranking"),
};
