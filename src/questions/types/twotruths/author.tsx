import {
  allOptionsFilled,
  blankDraft,
  type QuestionAuthor,
} from "../../ui/author";
import { TwoTruthsFields } from "../../../features/crowd/authorFields";

export const author: QuestionAuthor = {
  blank: () => blankDraft("twotruths", ["", "", ""]),
  titleLabel: "Your question",
  Fields: TwoTruthsFields,
  isValid: allOptionsFilled,
};
