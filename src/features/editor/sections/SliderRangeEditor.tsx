import { NumberInput } from "../../../components/NumberInput";
import { isSliderRangeValid, type EditorSectionProps } from "../editorTypes";

export function SliderRangeEditor({ draft, setDraft }: EditorSectionProps) {
  if (draft.type !== "slider") return null;
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
