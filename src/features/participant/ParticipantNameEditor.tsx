import { Check, X } from "lucide-react";
import { Modal } from "../../components/Modal";
import { useState, type FormEvent } from "react";
import { useParticipant } from "./ParticipantContext";

export function ParticipantNameEditor() {
  const {
    participantName,
    participantNameGenerated,
    nameChangeUsed,
    busy,
    renameParticipant,
    room,
  } = useParticipant();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(participantName);

  if (!participantName) return null;

  const canChangeName =
    room !== null && participantNameGenerated && !nameChangeUsed && !room.ended;

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim() || busy) return;
    if (await renameParticipant(draft)) setEditing(false);
  }

  const identity = (
    <>
      <strong>{participantName}</strong>
      <span
        className="participant-name-source"
        role="img"
        aria-label={
          participantNameGenerated ? "Generated name" : "Provided name"
        }
      >
        {participantNameGenerated ? "✨" : "👤"}
      </span>
    </>
  );

  return (
    <>
      {canChangeName ? (
        <button
          type="button"
          className="participant-identity is-editable"
          aria-label={`Change name once: ${participantName} (Generated name)`}
          title="Choose a provided name (you can do this once)"
          onClick={() => {
            setDraft(participantName);
            setEditing(true);
          }}
        >
          {identity}
        </button>
      ) : (
        <div
          className="participant-identity"
          aria-label={`${participantNameGenerated ? "Generated" : "Provided"} name: ${participantName}`}
          title={
            participantNameGenerated
              ? "Generated participant name"
              : "Name provided by you"
          }
        >
          {identity}
        </div>
      )}
      {editing && (
        <Modal
          title="Choose a name for this session"
          onClose={() => setEditing(false)}
        >
          <form className="editor-form" onSubmit={(event) => void save(event)}>
            <label>
              Choose a provided name
              <input
                autoFocus
                maxLength={24}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                aria-describedby="participant-name-hint"
              />
            </label>
            <small className="participant-name-hint" id="participant-name-hint">
              You can change this generated name once during the session.
            </small>
            <div className="modal-actions">
              <button
                type="submit"
                className="button primary"
                disabled={busy || !draft.trim()}
              >
                <Check size={15} />
                Save name
              </button>
              <button
                type="button"
                className="button secondary"
                disabled={busy}
                onClick={() => setEditing(false)}
              >
                <X size={15} />
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
