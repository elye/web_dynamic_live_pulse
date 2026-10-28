import type { EditorSection, QuestionEditor } from "../../ui/editor";
import { TitleFields } from "../../../features/editor/sections/TitleFields";

const SlideTitle: EditorSection = (props) => {
  const { draft, setDraft } = props;
  return (
    <>
      <TitleFields {...props} label="Title" />
      <label>
        Description
        <textarea
          required
          maxLength={280}
          value={draft.description || ""}
          onChange={(event) =>
            setDraft({ ...draft, description: event.target.value })
          }
          rows={5}
          placeholder="Add the details you'd like everyone to see..."
        />
        <small className="character-count">
          {(draft.description || "").length} / 280
        </small>
      </label>
    </>
  );
};

export const editor: QuestionEditor = {
  Title: SlideTitle,
  isValid: (draft) => !!draft.description?.trim(),
};
