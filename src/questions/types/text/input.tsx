import { TextInput } from "../../../features/participant/question/inputs/TextInput";
import { type QuestionInput } from "../../ui/input";

export const input: QuestionInput = {
  Input: () => (
    <TextInput
      label="Your thoughts"
      placeholder="There are no wrong answers..."
    />
  ),
};
