import { Plus, X } from "lucide-react";
import { IconButton } from "../../../components/IconButton";
import {
  defaultVoteColors,
  isVoteColorsValid,
  manyOptionLength,
  manyOptionsMax,
  voteColorsMax,
  type VoteColor,
} from "../../../model";
import type { EditorSectionProps } from "../../../questions/ui/editor";

/** Many options: the option boxes, the "Others" box, selection mode and vote colours. */
export function ManyOptionsEditor({ draft, setDraft }: EditorSectionProps) {
  const colors = draft.voteColors ?? defaultVoteColors;
  const setColors = (next: VoteColor[]) =>
    setDraft({ ...draft, voteColors: next });
  const setStep = (index: number, change: Partial<VoteColor>) =>
    setColors(
      colors.map((step, position) =>
        position === index ? { ...step, ...change } : step,
      ),
    );

  return (
    <>
      <fieldset>
        <legend>
          Options{" "}
          <span>
            · {draft.options.length} of {manyOptionsMax}, up to{" "}
            {manyOptionLength} characters each
          </span>
        </legend>
        {draft.options.map((option, index) => (
          <div className="option-editor" key={index}>
            <input
              aria-label={`Option ${index + 1}`}
              required
              maxLength={manyOptionLength}
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
            <IconButton
              icon={X}
              label={`Remove option ${index + 1}`}
              disabled={draft.options.length <= 2}
              onClick={() =>
                setDraft({
                  ...draft,
                  options: draft.options.filter(
                    (_, position) => position !== index,
                  ),
                })
              }
            />
          </div>
        ))}
        {draft.options.length < manyOptionsMax && (
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
      <label className="competitive-toggle">
        <input
          type="checkbox"
          checked={draft.others === true}
          onChange={(event) =>
            setDraft({ ...draft, others: event.target.checked })
          }
        />
        <span>
          <b>Add an “Others” option</b>
          <small>
            An extra box that is always shown to participants, even when they
            filter the options.
          </small>
        </span>
      </label>
      <label className="competitive-toggle">
        <input
          type="checkbox"
          checked={draft.multiple === true}
          onChange={(event) =>
            setDraft({ ...draft, multiple: event.target.checked })
          }
        />
        <span>
          <b>Allow multiple answers</b>
          <small>
            Participants can select more than one option. Otherwise they pick
            just one.
          </small>
        </span>
      </label>
      <fieldset>
        <legend>
          Box colour by votes <span>· default is red at 0, green from 1</span>
        </legend>
        {colors.map((step, index) => (
          <div className="option-editor vote-color-editor" key={index}>
            <span>From</span>
            <input
              type="number"
              min={0}
              step={1}
              aria-label={`Votes for colour ${index + 1}`}
              disabled={index === 0}
              value={Number.isNaN(step.min) ? "" : step.min}
              onChange={(event) =>
                setStep(index, {
                  min:
                    event.target.value === ""
                      ? Number.NaN
                      : Number(event.target.value),
                })
              }
            />
            <span>{step.min === 1 ? "vote" : "votes"}</span>
            <input
              type="color"
              aria-label={`Colour ${index + 1}`}
              value={step.color}
              onChange={(event) =>
                setStep(index, { color: event.target.value })
              }
            />
            <IconButton
              icon={X}
              label={`Remove colour ${index + 1}`}
              disabled={index === 0}
              onClick={() =>
                setColors(colors.filter((_, position) => position !== index))
              }
            />
          </div>
        ))}
        {!isVoteColorsValid(colors) && (
          <small role="alert">
            The first step starts at 0 votes and each step needs more votes than
            the one before.
          </small>
        )}
        <div className="vote-color-actions">
          {colors.length < voteColorsMax && (
            <button
              type="button"
              className="text-button"
              onClick={() => {
                const last = colors[colors.length - 1];
                setColors([
                  ...colors,
                  {
                    min: Number.isFinite(last.min) ? last.min + 1 : 1,
                    color: last.color,
                  },
                ]);
              }}
            >
              <Plus size={16} />
              Add colour step
            </button>
          )}
          {draft.voteColors && (
            <button
              type="button"
              className="text-button"
              onClick={() => setDraft({ ...draft, voteColors: undefined })}
            >
              Reset to default
            </button>
          )}
        </div>
      </fieldset>
    </>
  );
}
