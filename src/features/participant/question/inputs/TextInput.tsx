import { holdsSeveralSubmissions } from "../../../../questions";
import { useParticipant } from "../../ParticipantContext";

export function TextInput({
  label,
  placeholder,
  rows = 5,
  maxLength = 280,
}: {
  label: string;
  placeholder: string;
  rows?: number;
  maxLength?: number;
}) {
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
      {label}
      {holdsSeveralSubmissions(question) && (
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
        rows={rows}
        maxLength={maxLength}
        required
        placeholder={placeholder}
        value={String(currentAnswer)}
        onChange={(event) => {
          setAnswer(event.target.value);
          setAnswerQuestion(question.id);
        }}
      />
      <small className="character-count">
        {String(currentAnswer).length} / {maxLength}
      </small>
    </label>
  );
}
