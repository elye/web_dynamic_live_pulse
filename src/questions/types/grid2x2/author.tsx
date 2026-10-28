import {
  allOptionsFilled,
  blankDraft,
  type QuestionAuthor,
} from "../../ui/author";
import { GridFields } from "../../../features/crowd/authorFields";

export const author: QuestionAuthor = {
  blank: () => blankDraft("grid2x2", ["", "", "", ""]),
  titleLabel: "Your question",
  Fields: GridFields,
  isValid: allOptionsFilled,
};
