import { Download, Trash2 } from "lucide-react";
import { Modal } from "../../../components/Modal";
import { exportSession } from "../../../model";
import { useHost } from "../HostContext";

export function DeleteSessionModal() {
  const {
    deletingSession,
    setDeletingSession,
    deleteError,
    busy,
    deleteSession,
  } = useHost();
  if (!deletingSession) return null;
  return (
    <Modal
      title="Delete entire session?"
      onClose={() => {
        if (!busy) setDeletingSession(null);
      }}
    >
      <p className="muted delete-session-warning">
        Delete "{deletingSession.title}" and all its questions? Any linked live
        rooms and responses will also be deleted, and connected participants
        will be removed. This cannot be undone.
      </p>
      {deleteError && (
        <p className="error-banner" role="alert">
          {deleteError}
        </p>
      )}
      <div className="modal-actions session-delete-actions">
        <button
          className="button secondary"
          onClick={() => exportSession(deletingSession)}
        >
          <Download size={16} />
          Export JSON
        </button>
        <button
          className="button secondary"
          disabled={busy}
          onClick={() => setDeletingSession(null)}
        >
          Cancel
        </button>
        <button
          className="button danger"
          disabled={busy}
          onClick={() => void deleteSession()}
        >
          <Trash2 size={16} />
          {busy ? "Deleting..." : "Delete session"}
        </button>
      </div>
    </Modal>
  );
}
