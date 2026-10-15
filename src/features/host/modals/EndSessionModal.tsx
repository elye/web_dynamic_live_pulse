import { Check } from "lucide-react";
import { Modal } from "../../../components/Modal";
import { useHost } from "../HostContext";

export function EndSessionModal() {
  const { setModal, busy, control } = useHost();
  return (
    <Modal title="Ready to wrap up?" onClose={() => setModal(null)}>
      <p className="muted">
        This will close voting for everyone. You can review and export all
        responses afterward.
      </p>
      <div className="modal-actions">
        <button className="button secondary" onClick={() => setModal(null)}>
          Keep going
        </button>
        <button
          className="button primary"
          disabled={busy}
          onClick={() => void control("end")}
        >
          <Check size={16} />
          End session
        </button>
      </div>
    </Modal>
  );
}
