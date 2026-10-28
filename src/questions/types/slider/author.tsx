import {
  SliderRangeEditor,
  isSliderRangeValid,
} from "../../../features/editor/sections/SliderRangeEditor";
import { blankDraft, type QuestionAuthor } from "../../ui/author";

export const author: QuestionAuthor = {
  blank: () =>
    blankDraft("slider", [], { sliderMin: 0, sliderMax: 10, sliderStep: 1 }),
  titleLabel: "What should people estimate?",
  Fields: SliderRangeEditor,
  isValid: isSliderRangeValid,
};
