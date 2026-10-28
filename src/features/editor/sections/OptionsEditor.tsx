import { Plus, X } from "lucide-react";
import { IconButton } from "../../../components/IconButton";
import { canCompete } from "../../../model";
import { definitionOf } from "../../../questions";
import type {
  EditorSection,
  EditorSectionProps,
} from "../../../questions/ui/editor";

/** What differs between the types that edit a list of answer options. */
export type OptionsEditorConfig = {
  legend: string;
  /** Names the right answer in the hint, e.g. "the lie". */
  correctName?: string;
  /** Finishes "Option 1 is ..." on the radio for the right answer. */
  correctLabel?: string;
  /** Several options can be correct at once (when `multiple` is on). */
  multipleCorrect?: boolean;
  /** Placeholder for an option, given whether it is the correct one. */
  placeholder?: (isCorrect: boolean) => string;
};

/** Editable answer options, with correct-answer pickers for competitive kinds. */
export function OptionsEditor({
  draft,
  setDraft,
  legend,
  correctName = "the correct answer",
  correctLabel = "correct",
  multipleCorrect = false,
  placeholder,
}: EditorSectionProps & OptionsEditorConfig) {
  const rule = definitionOf(draft.type).options!;
  const resizable = rule.min !== rule.max;
  const hasCorrectAnswer = canCompete(draft.type);
  const multiQuiz = multipleCorrect && draft.multiple === true;
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
        {legend}{" "}
        {hasCorrectAnswer && (
          <span>
            · Select {multiQuiz ? "all the correct answers" : correctName}
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
              aria-label={`Option ${index + 1} is ${correctLabel}`}
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
            maxLength={rule.maxLength}
            placeholder={placeholder?.(draft.correct === index)}
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
          {resizable && (
            <IconButton
              icon={X}
              label={`Remove option ${index + 1}`}
              disabled={draft.options.length <= rule.min}
              onClick={() => removeOption(index)}
            />
          )}
        </div>
      ))}
      {resizable && draft.options.length < rule.max && (
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

/** An editor section for the answer options of one type. */
export const optionsSection =
  (config: OptionsEditorConfig): EditorSection =>
  (props) => <OptionsEditor {...props} {...config} />;
