import { NumberInput } from "../../../components/NumberInput";

type SliderRange = {
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
};

/** Slider ranges must be finite, ordered, with a positive step and at most 1,000 steps. */
export function isSliderRangeValid(draft: SliderRange) {
  return (
    typeof draft.sliderMin === "number" &&
    typeof draft.sliderMax === "number" &&
    typeof draft.sliderStep === "number" &&
    draft.sliderStep > 0 &&
    draft.sliderMax > draft.sliderMin &&
    (draft.sliderMax - draft.sliderMin) / draft.sliderStep <= 1000
  );
}

/** The minimum, maximum and step fields, for the host's editor and the player's form. */
export function SliderRangeEditor<T extends SliderRange>({
  draft,
  setDraft,
}: {
  draft: T;
  setDraft: (draft: T) => void;
}) {
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
      {!isSliderRangeValid(draft) && (
        <small className="field-error">
          Maximum must be greater than minimum, step must be positive, and the
          range can have at most 1,000 steps.
        </small>
      )}
    </fieldset>
  );
}
