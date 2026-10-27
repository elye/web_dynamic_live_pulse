import {
  isVoteColorsValid,
  manyOptionLength,
  manyOptionsMax,
  type Question,
} from "../../model";

/** Props shared by every editor section: the question being edited and its setter. */
export type EditorSectionProps = {
  draft: Question;
  setDraft: (draft: Question) => void;
};

/** Slider ranges must be finite, ordered, with a positive step and at most 1,000 steps. */
export function isSliderRangeValid(draft: Question) {
  if (draft.type !== "slider") return true;
  return (
    typeof draft.sliderMin === "number" &&
    typeof draft.sliderMax === "number" &&
    typeof draft.sliderStep === "number" &&
    draft.sliderStep > 0 &&
    draft.sliderMax > draft.sliderMin &&
    (draft.sliderMax - draft.sliderMin) / draft.sliderStep <= 1000
  );
}

/** Kinds whose answers are a list of editable text options. */
export function hasOptionList(draft: Question) {
  return (
    draft.type === "poll" ||
    draft.type === "quiz" ||
    draft.type === "truefalse" ||
    draft.type === "twotruths" ||
    draft.type === "ranking" ||
    draft.type === "points100"
  );
}

/** True when a quiz accepts several correct options. */
export function isMultiQuiz(draft: Question) {
  return draft.type === "quiz" && draft.multiple === true;
}

/** Many options: 2–30 non-blank options of at most 30 characters, valid colour steps. */
export function isManyOptionsValid(draft: Question) {
  if (draft.type !== "manyoptions") return true;
  return (
    draft.options.length >= 2 &&
    draft.options.length <= manyOptionsMax &&
    draft.options.every(
      (option) => !!option.trim() && option.length <= manyOptionLength,
    ) &&
    (!draft.voteColors || isVoteColorsValid(draft.voteColors))
  );
}

/** Whether the draft has everything required to be saved. */
export function isDraftSavable(draft: Question) {
  const options = hasOptionList(draft);
  const blankOption = draft.options.some((option) => !option.trim());
  return !(
    !draft.title.trim() ||
    (options && blankOption) ||
    (draft.type === "grid2x2" && blankOption) ||
    (draft.type === "slide" && !draft.description?.trim()) ||
    (draft.type === "cloud" &&
      (!Number.isInteger(draft.maxSubmissions ?? 1) ||
        (draft.maxSubmissions ?? 1) < 1 ||
        (draft.maxSubmissions ?? 1) > 5)) ||
    (isMultiQuiz(draft) && !(draft.corrects ?? []).length) ||
    !isSliderRangeValid(draft) ||
    !isManyOptionsValid(draft)
  );
}
