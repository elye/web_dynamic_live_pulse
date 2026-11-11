import { Plus, X } from "lucide-react";
import { IconButton } from "../../../components/IconButton";
import { NumberInput } from "../../../components/NumberInput";

type SliderRange = {
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
};
type SliderChoices = { sliderChoices?: string[] };

/** Slider ranges must be finite, ordered, with a positive step and at most 1,000 steps. */
export function isSliderRangeValid(draft: SliderRange & SliderChoices) {
  const choices = draft.sliderChoices ?? [];
  return (
    typeof draft.sliderMin === "number" &&
    typeof draft.sliderMax === "number" &&
    typeof draft.sliderStep === "number" &&
    draft.sliderStep > 0 &&
    draft.sliderMax > draft.sliderMin &&
    (draft.sliderMax - draft.sliderMin) / draft.sliderStep <= 1000 &&
    choices.length <= 3 &&
    choices.every(
      (choice) => choice.trim().length > 0 && choice.trim().length <= 80,
    ) &&
    new Set(choices.map((choice) => choice.trim().toLocaleLowerCase())).size ===
      choices.length
  );
}

/** Slider range and optional alternative-answer fields for editors and player forms. */
export function SliderRangeEditor<T extends SliderRange & SliderChoices>({
  draft,
  setDraft,
}: {
  draft: T;
  setDraft: (draft: T) => void;
}) {
  const choices = draft.sliderChoices ?? [];
  return (
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
      <div className="slider-alternative-editor">
        <strong>Alternative answers (optional)</strong>
        {choices.map((choice, index) => (
          <label key={index}>
            Answer {index + 1}
            <input
              type="text"
              maxLength={80}
              aria-label={`Alternative answer ${index + 1}`}
              value={choice}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  sliderChoices: choices.map((item, position) =>
                    position === index ? event.target.value : item,
                  ),
                })
              }
            />
            <IconButton
              icon={X}
              label={`Remove alternative answer ${index + 1}`}
              onClick={() =>
                setDraft({
                  ...draft,
                  sliderChoices: choices.filter(
                    (_, position) => position !== index,
                  ),
                })
              }
            />
          </label>
        ))}
        {choices.length < 3 && (
          <button
            type="button"
            className="text-button"
            onClick={() =>
              setDraft({ ...draft, sliderChoices: [...choices, ""] })
            }
          >
            <Plus size={16} />
            Add alternative answer
          </button>
        )}
      </div>
      {!isSliderRangeValid(draft) && (
        <small className="field-error">
          Use a valid slider range and up to 3 unique alternative answers, each
          1 to 80 characters.
        </small>
      )}
    </fieldset>
  );
}
