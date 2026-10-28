import { ChoiceInput } from "../../../features/participant/question/inputs/ChoiceInput";
import { choiceBehaviour } from "../../ui/choiceInput";
import { type QuestionInput } from "../../ui/input";

export const input: QuestionInput = {
  ...choiceBehaviour,
  correctAnswerLabel: "The lie",
  Input: () => <ChoiceInput twoColumns={false} />,
};
