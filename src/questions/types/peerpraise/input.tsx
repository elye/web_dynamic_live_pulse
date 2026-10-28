import { TextInput } from "../../../features/participant/question/inputs/TextInput";
import { useParticipant } from "../../../features/participant/ParticipantContext";
import { type QuestionInput } from "../../ui/input";

function Target() {
  const { question } = useParticipant();
  if (!question?.assignedTo) return null;
  return (
    <div className="peerpraise-target">
      <strong>{question.assignedTo}</strong>
    </div>
  );
}

export const input: QuestionInput = {
  Header: Target,
  Input: () => (
    <TextInput
      label="Your kind word or message"
      placeholder="Write something kind..."
    />
  ),
};
