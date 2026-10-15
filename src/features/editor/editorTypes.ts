import type { Question } from "../../model";

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

/** Whether the draft has everything required to be saved. */
export function isDraftSavable(draft: Question) {
  const options = hasOptionList(draft);
  const blankOption = draft.options.some((option) => !option.trim());
  return !(
    !draft.title.trim() ||
    (options && blankOption) ||
    (draft.type === "grid2x2" && blankOption) ||
    (draft.type === "slide" && !draft.description?.trim()) ||
    (isMultiQuiz(draft) && !(draft.corrects ?? []).length) ||
    !isSliderRangeValid(draft)
  );
}
