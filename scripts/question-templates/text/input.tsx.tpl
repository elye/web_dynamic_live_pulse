import { TextInput } from "../../../features/participant/question/inputs/TextInput";
import { type QuestionInput } from "../../ui/input";

// TODO(new-question): the control a participant answers with.
export const input: QuestionInput = {
  Input: () => (
    <TextInput label="Your answer" placeholder="Type your answer..." />
  ),
};
