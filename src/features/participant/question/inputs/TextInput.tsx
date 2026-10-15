import { useParticipant } from "../../ParticipantContext";

export function TextInput() {
  const { setAnswer, setAnswerQuestion, question, currentAnswer, room } =
    useParticipant();
  if (!room || !question) return null;
  return (
    <label>
      {question.type === "cloud"
        ? "Your word or short phrase"
        : "Your thoughts"}
      <textarea
        rows={question.type === "cloud" ? 2 : 5}
        maxLength={question.type === "cloud" ? 30 : 280}
        required
        placeholder={
          question.type === "cloud"
            ? "First thing that comes to mind..."
            : "There are no wrong answers..."
        }
        value={String(currentAnswer)}
        onChange={(event) => {
          setAnswer(event.target.value);
          setAnswerQuestion(question.id);
        }}
      />
      <small className="character-count">
        {String(currentAnswer).length} / {question.type === "cloud" ? 30 : 280}
      </small>
    </label>
  );
}
