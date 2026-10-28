import { hasNoBlankOptions, type QuestionEditor } from "../../ui/editor";
import { optionsSection } from "../../../features/editor/sections/OptionsEditor";
import type { EditorSection } from "../../ui/editor";

const PollSettings: EditorSection = ({ draft, setDraft }) => (
  <>
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
          Participants can select more than one option. Percentages show how
          many participants picked each option.
        </small>
      </span>
    </label>
    <label>
      <span>Response display</span>
      <select
        aria-label="Response display"
        value={draft.pollDisplay ?? "list"}
        onChange={(event) =>
          setDraft({
            ...draft,
            pollDisplay: event.target.value as NonNullable<
              typeof draft.pollDisplay
            >,
          })
        }
      >
        <option value="list">Current response display</option>
        <option value="pie">Pie chart</option>
        <option value="stacked">Single stack horizontal bar</option>
        <option value="bar">Vertical bars</option>
      </select>
    </label>
  </>
);

export const editor: QuestionEditor = {
  settings: [PollSettings],
  fields: [optionsSection({ legend: "Answer options" })],
  isValid: hasNoBlankOptions,
};
