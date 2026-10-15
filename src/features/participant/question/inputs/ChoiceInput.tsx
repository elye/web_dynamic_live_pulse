import { Check } from "lucide-react";
import { useParticipant } from "../../ParticipantContext";

export function ChoiceInput() {
  const {
    setAnswer,
    setAnswerQuestion,
    question,
    currentAnswer,
    isMultiple,
    selectedOptions,
    room,
  } = useParticipant();
  if (!room || !question) return null;
  return (
    <div
      className={`answer-options ${question.options.length >= 4 && question.type !== "twotruths" ? "two-col" : ""}`}
    >
      {isMultiple && (
        <small className="multi-hint">Select all that apply</small>
      )}
      {question.options.map((option, index) => {
        const chosen = isMultiple
          ? selectedOptions.includes(index)
          : currentAnswer === index;
        return (
          <button
            type="button"
            key={index}
            className={`answer-option ${chosen ? "chosen" : ""}`}
            onClick={() => {
              setAnswer(
                isMultiple
                  ? chosen
                    ? selectedOptions.filter((item) => item !== index)
                    : [...selectedOptions, index]
                  : index,
              );
              setAnswerQuestion(question.id);
            }}
            aria-pressed={chosen}
          >
            <span className={`option-letter color-${index % 4}`}>
              {String.fromCharCode(65 + index)}
            </span>
            <span>{option}</span>
            {chosen && <Check size={20} />}
          </button>
        );
      })}
    </div>
  );
}
