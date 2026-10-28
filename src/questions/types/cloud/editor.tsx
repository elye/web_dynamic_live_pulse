import { NumberInput } from "../../../components/NumberInput";
import type { EditorSection, QuestionEditor } from "../../ui/editor";

const CloudSettings: EditorSection = ({ draft, setDraft }) => (
  <fieldset className="cloud-submission-editor">
    <label>
      <span>
        <b>Submissions per participant</b>
        <small>
          Let each participant contribute this many words or short phrases.
          Default is 1.
        </small>
      </span>
      <NumberInput
        required
        min={1}
        max={5}
        step={1}
        value={draft.maxSubmissions ?? 1}
        onValue={(value) =>
          setDraft({
            ...draft,
            maxSubmissions: Math.max(1, Math.min(5, Math.round(value))),
          })
        }
      />
    </label>
  </fieldset>
);

export const editor: QuestionEditor = {
  settings: [CloudSettings],
  isValid: ({ maxSubmissions = 1 }) =>
    Number.isInteger(maxSubmissions) &&
    maxSubmissions >= 1 &&
    maxSubmissions <= 5,
};
