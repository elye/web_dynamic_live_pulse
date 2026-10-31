import { Check, ChevronDown } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Modal } from "../../components/Modal";
import { canCompete, hasRevealMode, type Question } from "../../model";
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
  const [showMore, setShowMore] = useState(false);
  const section = { draft, setDraft };
  const {
    Title = TitleFields,
    settings = [],
    fields = [],
  } = editorOf(draft.type);

  const hasMoreSettings =
    canCompete(draft.type) || hasRevealMode(draft.type) || settings.length > 0;

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
        {fields.map((Section, index) => (
          <Section key={index} {...section} />
        ))}
        {hasMoreSettings && (
          <button
            type="button"
            className="text-button more-settings-toggle"
            aria-expanded={showMore}
            aria-controls="editor-more-settings"
            onClick={() => setShowMore(!showMore)}
          >
            <ChevronDown size={16} />
            More settings
          </button>
        )}
        {hasMoreSettings && showMore && (
          <div id="editor-more-settings" className="editor-more-settings">
            <ScoringOptions {...section} />
            {settings.map((Section, index) => (
              <Section key={index} {...section} />
            ))}
            <RevealModeEditor {...section} />
          </div>
        )}
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
