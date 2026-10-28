import { ChoiceInput } from "../../../features/participant/question/inputs/ChoiceInput";
import { choiceBehaviour } from "../../ui/choiceInput";
import { type QuestionInput } from "../../ui/input";

// TODO(new-question): the control a participant answers with.
export const input: QuestionInput = {
  ...choiceBehaviour,
  Input: () => <ChoiceInput />,
};
