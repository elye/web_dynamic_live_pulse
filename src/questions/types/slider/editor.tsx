import {
  SliderRangeEditor,
  isSliderRangeValid,
} from "../../../features/editor/sections/SliderRangeEditor";
import type { QuestionEditor } from "../../ui/editor";

export const editor: QuestionEditor = {
  fields: [SliderRangeEditor],
  isValid: isSliderRangeValid,
};
