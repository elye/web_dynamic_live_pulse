import { inputOf } from "../../../questions/ui/inputRegistry";
import { useParticipant } from "../ParticipantContext";
import { SubmitButton } from "./inputs/SubmitButton";

export function AnswerForm() {
  const { room, question, vote } = useParticipant();
  if (!room || !question) return null;
  const { Input } = inputOf(question.type);
  return (
    <form onSubmit={vote} className="answer-form">
      {Input && <Input />}
      <SubmitButton />
    </form>
  );
}
