import { Trash2 } from "lucide-react";
import { Modal } from "../../../components/Modal";
import { useHost } from "../HostContext";

export function DeleteQuestionModal() {
  const {
    setSelected,
    setModal,
    session,
    currentIndex,
    question,
    updateSession,
  } = useHost();
  return (
    <Modal title="Delete this question?" onClose={() => setModal(null)}>
      <p className="muted">
        “{question.title}” will be removed from this session.
      </p>
      <div className="modal-actions">
        <button className="button secondary" onClick={() => setModal(null)}>
          Cancel
        </button>
        <button
          className="button danger"
          onClick={() => {
            updateSession({
              questions: session.questions.filter(
                (item) => item.id !== question.id,
              ),
            });
            setSelected(Math.max(0, currentIndex - 1));
            setModal(null);
          }}
        >
          <Trash2 size={16} />
          Delete question
        </button>
      </div>
    </Modal>
  );
}
