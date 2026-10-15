import { CheckCheck } from "lucide-react";
import { MyAnswer } from "../MyAnswer";
import { useParticipant } from "../ParticipantContext";

export function SubmittedState() {
  const { answers, question, room } = useParticipant();
  if (!room || !question) return null;
  return (
    <div className="submitted-state">
      <span>
        <CheckCheck size={43} />
      </span>
      <h2>Your voice is in.</h2>
      <p>Let’s see what everyone thinks.</p>
      <MyAnswer question={question} answer={answers[question.id]} />
      <div className="waiting-dots">
        <i />
        <i />
        <i />
      </div>
      <small>Waiting for your host</small>
    </div>
  );
}
