import { Plus, X } from "lucide-react";
import { IconButton } from "../../../components/IconButton";
import { canCompete } from "../../../model";
import {
  hasOptionList,
  isMultiQuiz,
  type EditorSectionProps,
} from "../editorTypes";

/** Editable answer options, with correct-answer pickers for competitive kinds. */
export function OptionsEditor({ draft, setDraft }: EditorSectionProps) {
  if (!hasOptionList(draft)) return null;
  const isTrueFalse = draft.type === "truefalse";
  const isTwoTruths = draft.type === "twotruths";
  const isRanking = draft.type === "ranking";
  const isPoints100 = draft.type === "points100";
  const hasCorrectAnswer = canCompete(draft.type);
  const multiQuiz = isMultiQuiz(draft);
  const draftCorrects = draft.corrects ?? [];
  const setDraftCorrects = (next: number[]) =>
    setDraft({
      ...draft,
      corrects: next,
      correct: next.length ? Math.min(...next) : null,
    });

  function removeOption(index: number) {
    const options = draft.options.filter((_, position) => position !== index);
    if (multiQuiz) {
      const next = draftCorrects
        .filter((item) => item !== index)
        .map((item) => (item > index ? item - 1 : item));
      setDraft({
        ...draft,
        options,
        corrects: next,
        correct: next.length ? Math.min(...next) : null,
      });
      return;
    }
    setDraft({
      ...draft,
      options,
      correct: hasCorrectAnswer
        ? draft.correct === index
          ? 0
          : draft.correct! > index
            ? draft.correct! - 1
            : draft.correct
        : null,
    });
  }

  return (
    <fieldset>
      <legend>
        {isRanking
          ? "Items to rank"
          : isPoints100
            ? "Options to allocate points across"
            : isTwoTruths
              ? "Two truths and one lie"
              : "Answer options"}{" "}
        {hasCorrectAnswer && (
          <span>
            · Select{" "}
            {isTwoTruths
              ? "the lie"
              : multiQuiz
                ? "all the correct answers"
                : "the correct answer"}
          </span>
        )}
      </legend>
      {draft.options.map((option, index) => (
        <div className="option-editor" key={index}>
          {multiQuiz ? (
            <input
              aria-label={`Option ${index + 1} is correct`}
              type="checkbox"
              checked={draftCorrects.includes(index)}
              onChange={(event) =>
                setDraftCorrects(
                  event.target.checked
                    ? [...draftCorrects, index]
                    : draftCorrects.filter((item) => item !== index),
                )
              }
            />
          ) : hasCorrectAnswer ? (
            <input
              aria-label={
                isTwoTruths
                  ? `Option ${index + 1} is the lie`
                  : `Option ${index + 1} is correct`
              }
              type="radio"
              name="correct"
              checked={draft.correct === index}
              onChange={() => setDraft({ ...draft, correct: index })}
            />
          ) : (
            <span className={`option-letter color-${index % 4}`}>
              {String.fromCharCode(65 + index)}
            </span>
          )}
          <input
            aria-label={`Option ${index + 1}`}
            required
            maxLength={isTwoTruths ? 200 : 100}
            placeholder={
              isTwoTruths
                ? draft.correct === index
                  ? "The lie"
                  : "A true statement"
                : undefined
            }
            value={option}
            onChange={(event) =>
              setDraft({
                ...draft,
                options: draft.options.map((text, position) =>
                  position === index ? event.target.value : text,
                ),
              })
            }
          />
          {!isTrueFalse && !isTwoTruths && (
            <IconButton
              icon={X}
              label={`Remove option ${index + 1}`}
              disabled={draft.options.length <= 2}
              onClick={() => removeOption(index)}
            />
          )}
        </div>
      ))}
      {!isTrueFalse && !isTwoTruths && draft.options.length < 6 && (
        <button
          type="button"
          className="text-button"
          onClick={() =>
            setDraft({ ...draft, options: [...draft.options, ""] })
          }
        >
          <Plus size={16} />
          Add option
        </button>
      )}
    </fieldset>
  );
}
