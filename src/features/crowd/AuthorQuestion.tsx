import { CheckCheck, LoaderCircle, Plus, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "../../components/IconButton";
import { NumberInput } from "../../components/NumberInput";
import {
  labels,
  readStored,
  store,
  twoTruthsTitle,
  type Kind,
} from "../../model";
import { blankAuthored, type Authored } from "./authoring";

/** The form every player fills in to write their own question of the host's chosen type. */
export function AuthorQuestion({
  kind,
  sent,
  busy,
  disabled,
  initial,
  draftKey,
  onSubmit,
}: {
  kind: Kind;
  sent: boolean;
  busy: boolean;
  disabled: boolean;
  initial?: Authored;
  draftKey: string;
  onSubmit: (question: Authored) => void;
}) {
  // Unsent edits survive a refresh; otherwise the question already submitted is shown again.
  const [draft, setDraft] = useState<Authored>(() => {
    const saved = readStored<{ kind?: Kind; draft?: Authored } | null>(
      draftKey,
      null,
    );
    if (saved?.kind === kind && saved.draft) return saved.draft;
    return initial
      ? { ...blankAuthored(kind), ...initial }
      : blankAuthored(kind);
  });
  const firstDraft = useRef(draft);
  useEffect(() => {
    if (draft !== firstDraft.current) store(draftKey, { kind, draft });
  }, [draft, draftKey, kind]);
  const isOptions = ["poll", "quiz", "ranking", "points100"].includes(kind);
  const isTrueFalse = kind === "truefalse";
  const isTwoTruths = kind === "twotruths";
  const isGrid = kind === "grid2x2";
  const isSlider = kind === "slider";
  const hasCorrect = kind === "quiz" || isTrueFalse;
  const multiQuiz = kind === "quiz" && draft.multiple === true;
  const setCorrects = (next: number[]) =>
    setDraft({
      ...draft,
      corrects: next,
      correct: next.length ? Math.min(...next) : null,
    });
  const sliderOk =
    !isSlider ||
    (typeof draft.sliderMin === "number" &&
      typeof draft.sliderMax === "number" &&
      typeof draft.sliderStep === "number" &&
      draft.sliderStep > 0 &&
      draft.sliderMax > draft.sliderMin &&
      (draft.sliderMax - draft.sliderMin) / draft.sliderStep <= 1000);
  const valid =
    (isTwoTruths || !!draft.title.trim()) &&
    sliderOk &&
    (!multiQuiz || (draft.corrects ?? []).length > 0) &&
    (!(isOptions || isGrid || isTwoTruths) ||
      draft.options.every((option) => option.trim())) &&
    (!isOptions || (draft.options.length >= 2 && draft.options.length <= 6));
  const setOption = (index: number, text: string) =>
    setDraft({
      ...draft,
      options: draft.options.map((value, position) =>
        position === index ? text : value,
      ),
    });
  const axisNames = [
    "X axis · left (low)",
    "X axis · right (high)",
    "Y axis · bottom (low)",
    "Y axis · top (high)",
  ];
  return (
    <form
      className="answer-form author-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          ...draft,
          title: isTwoTruths ? twoTruthsTitle : draft.title.trim(),
          options: draft.options.map((option) => option.trim()),
        });
      }}
    >
      <div>
        <span className="eyebrow">
          YOUR TURN · {labels[kind].toLocaleUpperCase()}
        </span>
        <h1>Write a question for everyone</h1>
        <p className="author-note">
          Everyone writes one. All questions are played in random order and show
          who asked them.
        </p>
      </div>
      {sent && (
        <div className="qna-submitted-note">
          <CheckCheck size={20} />
          Your question is in. You can still edit it until the host starts the
          game.
        </div>
      )}
      {isTwoTruths ? (
        <p className="fixed-question">{twoTruthsTitle}</p>
      ) : (
        <label>
          {isSlider
            ? "What should people estimate?"
            : isTrueFalse
              ? "Your true-or-false statement"
              : "Your question"}
          <textarea
            required
            rows={3}
            maxLength={200}
            value={draft.title}
            onChange={(event) =>
              setDraft({ ...draft, title: event.target.value })
            }
            placeholder="Type your question..."
          />
          <small className="character-count">{draft.title.length} / 200</small>
        </label>
      )}
      {isTwoTruths && (
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
                onChange={(event) => setOption(index, event.target.value)}
                placeholder={
                  draft.correct === index ? "The lie" : "A true statement"
                }
              />
            </div>
          ))}
        </fieldset>
      )}
      {isTrueFalse && (
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
      )}
      {(kind === "poll" || kind === "quiz") && (
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
      )}
      {isOptions && (
        <fieldset className="author-options">
          <legend>
            {kind === "ranking"
              ? "Items to rank"
              : kind === "points100"
                ? "Options to allocate points across"
                : "Answer options"}
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
                        : (draft.corrects ?? []).filter(
                            (item) => item !== index,
                          ),
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
                onChange={(event) => setOption(index, event.target.value)}
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
      )}
      {isGrid && (
        <fieldset className="author-options">
          <legend>Axis labels</legend>
          {axisNames.map((name, index) => (
            <label key={index}>
              {name}
              <input
                required
                maxLength={40}
                value={draft.options[index] ?? ""}
                onChange={(event) => setOption(index, event.target.value)}
              />
            </label>
          ))}
        </fieldset>
      )}
      {isSlider && (
        <fieldset className="slider-range-editor">
          <legend>Slider range</legend>
          <label>
            Minimum
            <NumberInput
              required
              step="any"
              value={draft.sliderMin ?? 0}
              onValue={(value) => setDraft({ ...draft, sliderMin: value })}
            />
          </label>
          <label>
            Maximum
            <NumberInput
              required
              step="any"
              value={draft.sliderMax ?? 10}
              onValue={(value) => setDraft({ ...draft, sliderMax: value })}
            />
          </label>
          <label>
            Step
            <NumberInput
              required
              min={0.01}
              step="any"
              value={draft.sliderStep ?? 1}
              onValue={(value) => setDraft({ ...draft, sliderStep: value })}
            />
          </label>
          {!sliderOk && (
            <small className="field-error">
              Maximum must be greater than minimum, step must be positive, and
              the range can have at most 1,000 steps.
            </small>
          )}
        </fieldset>
      )}
      <button
        className="button primary full"
        disabled={busy || disabled || !valid}
      >
        {busy ? (
          <LoaderCircle className="spin" size={18} />
        ) : (
          <>
            <Send size={17} />
            {sent ? "Update my question" : "Submit my question"}
          </>
        )}
      </button>
    </form>
  );
}
