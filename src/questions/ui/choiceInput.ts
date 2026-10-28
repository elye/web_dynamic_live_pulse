import { isBlank, type AnswerValue, type QuestionInput } from "./input";

/** Picking options: one index, or a list of them when the question allows several. */
export const choiceBehaviour: Pick<
  QuestionInput,
  "resolve" | "isReady" | "listsAnswers"
> = {
  resolve: (question, touched) =>
    question.multiple === true
      ? Array.isArray(touched)
        ? touched
        : []
      : touched,
  isReady: (question, value) =>
    question.multiple === true
      ? Array.isArray(value) && value.length > 0
      : !isBlank(value),
  listsAnswers: true,
};

export const pickedOptions = (touched: AnswerValue): number[] =>
  Array.isArray(touched) ? touched : [];
