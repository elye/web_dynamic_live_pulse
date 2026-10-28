import { Plus, X } from "lucide-react";
import { IconButton } from "../../components/IconButton";
import { axes } from "../editor/sections/GridAxisEditor";
import type { AuthorFieldsProps } from "../../questions/ui/author";

const setOption = (
  { draft, setDraft }: AuthorFieldsProps,
  index: number,
  text: string,
) =>
  setDraft({
    ...draft,
    options: draft.options.map((value, position) =>
      position === index ? text : value,
    ),
  });

/** "Allow multiple answers" for polls and quizzes. */
export function MultipleToggle({ draft, setDraft }: AuthorFieldsProps) {
  return (
    <label className="competitive-toggle">
      <input
        type="checkbox"
        checked={draft.multiple === true}
        onChange={(event) =>
          event.target.checked
            ? setDraft({
                ...draft,
                multiple: true,
                corrects: [draft.correct ?? 0],
              })
            : setDraft({
                ...draft,
                multiple: false,
                corrects: undefined,
                correct: draft.corrects?.length
                  ? Math.min(...draft.corrects)
                  : 0,
              })
        }
      />
      <span>
        <b>Allow multiple answers</b>
        <small>Players can select more than one option.</small>
      </span>
    </label>
  );
}

/** What differs between the types where players write a list of options. */
export type AuthorOptionsConfig = {
  legend: string;
  /** The player marks the correct answer. */
  hasCorrect?: boolean;
  /** Several options can be correct (when `multiple` is on). */
  multipleCorrect?: boolean;
};

/** The player's editable list of options, with correct-answer pickers when scored. */
export function AuthorOptions({
  draft,
  setDraft,
  legend,
  hasCorrect = false,
  multipleCorrect = false,
}: AuthorFieldsProps & AuthorOptionsConfig) {
  const multiQuiz = multipleCorrect && draft.multiple === true;
  const setCorrects = (next: number[]) =>
    setDraft({
      ...draft,
      corrects: next,
      correct: next.length ? Math.min(...next) : null,
    });
  const section = { draft, setDraft };
  return (
    <fieldset className="author-options">
      <legend>
        {legend}
        {hasCorrect && (
          <span>
            {" "}
            · Select{" "}
            {multiQuiz ? "all the correct answers" : "the correct answer"}
          </span>
        )}
      </legend>
      {draft.options.map((option, index) => (
        <div className="option-editor" key={index}>
          {multiQuiz ? (
            <input
              aria-label={`Option ${index + 1} is correct`}
              type="checkbox"
              checked={(draft.corrects ?? []).includes(index)}
              onChange={(event) =>
                setCorrects(
                  event.target.checked
                    ? [...(draft.corrects ?? []), index]
                    : (draft.corrects ?? []).filter((item) => item !== index),
                )
              }
            />
          ) : hasCorrect ? (
            <input
              aria-label={`Option ${index + 1} is correct`}
              type="radio"
              name="author-correct"
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
            maxLength={100}
            value={option}
            onChange={(event) => setOption(section, index, event.target.value)}
          />
          <IconButton
            icon={X}
            label={`Remove option ${index + 1}`}
            disabled={draft.options.length <= 2}
            onClick={() => {
              const options = draft.options.filter(
                (_, position) => position !== index,
              );
              if (multiQuiz) {
                const next = (draft.corrects ?? [])
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
                correct: hasCorrect
                  ? draft.correct === index
                    ? 0
                    : draft.correct! > index
                      ? draft.correct! - 1
                      : draft.correct
                  : null,
              });
            }}
          />
        </div>
      ))}
      {draft.options.length < 6 && (
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

/** Options for the type's own list, wrapped as a fields component. */
export const authorOptionsFields =
  (config: AuthorOptionsConfig) => (props: AuthorFieldsProps) => (
    <AuthorOptions {...props} {...config} />
  );

/** Two statements to pick between, one of them marked correct. */
export function TrueFalseFields({ draft, setDraft }: AuthorFieldsProps) {
  return (
    <fieldset className="author-options">
      <legend>Which is correct?</legend>
      {draft.options.map((option, index) => (
        <label className="author-choice" key={index}>
          <input
            type="radio"
            name="author-correct"
            checked={draft.correct === index}
            onChange={() => setDraft({ ...draft, correct: index })}
          />
          {option}
        </label>
      ))}
    </fieldset>
  );
}

export function TwoTruthsFields({ draft, setDraft }: AuthorFieldsProps) {
  return (
    <fieldset className="author-options two-truths-options">
      <legend>
        Write two truths and one lie<span> · Select the lie</span>
      </legend>
      {draft.options.map((option, index) => (
        <div className="option-editor" key={index}>
          <input
            aria-label={`Statement ${index + 1} is the lie`}
            type="radio"
            name="author-correct"
            checked={draft.correct === index}
            onChange={() => setDraft({ ...draft, correct: index })}
          />
          <input
            aria-label={`Statement ${index + 1}`}
            required
            maxLength={200}
            value={option}
            onChange={(event) =>
              setOption({ draft, setDraft }, index, event.target.value)
            }
            placeholder={
              draft.correct === index ? "The lie" : "A true statement"
            }
          />
        </div>
      ))}
    </fieldset>
  );
}

export function GridFields({ draft, setDraft }: AuthorFieldsProps) {
  return (
    <fieldset className="author-options">
      <legend>Axis labels</legend>
      {axes.map((name, index) => (
        <label key={index}>
          {name}
          <input
            required
            maxLength={40}
            value={draft.options[index] ?? ""}
            onChange={(event) =>
              setOption({ draft, setDraft }, index, event.target.value)
            }
          />
        </label>
      ))}
    </fieldset>
  );
}
