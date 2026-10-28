import { Check } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Modal } from "../../components/Modal";
import type { Question } from "../../model";
import { editorOf } from "../../questions/ui/editorRegistry";
import { isDraftSavable } from "./editorTypes";
import { RevealModeEditor } from "./sections/RevealModeEditor";
import { ScoringOptions } from "./sections/ScoringOptions";
import { TitleFields } from "./sections/TitleFields";
import { TypeSelect } from "./sections/TypeSelect";

/** Modal form for editing one question. Each section edits the shared draft. */
export function QuestionEditor({
  question,
  onSave,
  onClose,
}: {
  question: Question;
  onSave: (question: Question) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(question);
  const section = { draft, setDraft };
  const {
    Title = TitleFields,
    settings = [],
    fields = [],
  } = editorOf(draft.type);

  function submit(event: FormEvent) {
    event.preventDefault();
    onSave(draft);
    onClose();
  }

  return (
    <Modal title="Edit question" onClose={onClose}>
      <form onSubmit={submit} className="editor-form">
        <TypeSelect {...section} />
        <Title {...section} />
        <ScoringOptions {...section} />
        {settings.map((Section, index) => (
          <Section key={index} {...section} />
        ))}
        <RevealModeEditor {...section} />
        {fields.map((Section, index) => (
          <Section key={index} {...section} />
        ))}
        <div className="modal-actions">
          <button className="button secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="button primary"
            type="submit"
            disabled={!isDraftSavable(draft)}
          >
            <Check size={16} />
            Save question
          </button>
        </div>
      </form>
    </Modal>
  );
}
