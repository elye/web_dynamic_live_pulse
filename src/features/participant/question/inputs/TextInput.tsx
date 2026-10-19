import { useParticipant } from "../../ParticipantContext";

export function TextInput() {
  const {
    setAnswer,
    setAnswerQuestion,
    question,
    currentAnswer,
    room,
    maxSubmissions,
    submissionCount,
  } = useParticipant();
  if (!room || !question) return null;
  const remaining = Math.max(0, maxSubmissions - submissionCount);
  return (
    <label>
      {question.type === "cloud"
        ? "Your word or short phrase"
        : "Your thoughts"}
      {question.type === "cloud" && (
        <small className="multi-hint cloud-submit-hint">
          You can contribute up to {maxSubmissions}{" "}
          {maxSubmissions === 1 ? "time" : "times"}
          {submissionCount > 0
            ? ` — ${remaining} ${remaining === 1 ? "submission" : "submissions"} left`
            : ""}
          .
        </small>
      )}
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
