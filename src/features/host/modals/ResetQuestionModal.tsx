import { RotateCcw } from "lucide-react";
import { Modal } from "../../../components/Modal";
import { useHost } from "../HostContext";

export function ResetQuestionModal() {
  const { setModal, busy, control } = useHost();
  return (
    <Modal title="Reset this question?" onClose={() => setModal(null)}>
      <p className="muted">
        This clears every response to this question and reopens it, so players
        can answer again. Other questions are not affected.
      </p>
      <div className="modal-actions">
        <button className="button secondary" onClick={() => setModal(null)}>
          Cancel
        </button>
        <button
          className="button primary"
          disabled={busy}
          onClick={() => void control("reset")}
        >
          <RotateCcw size={16} />
          Reset question
        </button>
      </div>
    </Modal>
  );
}
