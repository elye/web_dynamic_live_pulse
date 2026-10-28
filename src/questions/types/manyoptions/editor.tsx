import { ManyOptionsEditor } from "../../../features/editor/sections/ManyOptionsEditor";
import {
  isVoteColorsValid,
  manyOptionLength,
  manyOptionsMax,
} from "../../../model";
import type { QuestionEditor } from "../../ui/editor";

/** 2–30 non-blank options of at most 30 characters, valid colour steps. */
export const editor: QuestionEditor = {
  fields: [ManyOptionsEditor],
  isValid: (draft) =>
    draft.options.length >= 2 &&
    draft.options.length <= manyOptionsMax &&
    draft.options.every(
      (option) => !!option.trim() && option.length <= manyOptionLength,
    ) &&
    (!draft.voteColors || isVoteColorsValid(draft.voteColors)),
};
