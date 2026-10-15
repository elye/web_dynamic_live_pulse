import { Upload } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Modal } from "../../components/Modal";
import { importSession, type Session } from "../../model";

export function ImportSessionModal({
  onImport,
  onClose,
}: {
  onImport: (session: Session) => void;
  onClose: () => void;
}) {
  const [json, setJson] = useState("");
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  async function readFile(file?: File) {
    if (!file) return;
    setError("");
    if (file.size > 128 * 1024) {
      setError("JSON must be smaller than 128 KB.");
      return;
    }
    setReading(true);
    try {
      setJson(await file.text());
    } catch {
      setError("Could not read this file. Try again or paste its JSON.");
    } finally {
      setReading(false);
    }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      onImport(importSession(json));
    } catch (failure) {
      setError((failure as Error).message);
    }
  }
  return (
    <Modal title="Import session JSON" onClose={onClose}>
      <form className="editor-form" onSubmit={submit}>
        <label>
          JSON file
          <input
            type="file"
            accept=".json,application/json"
            disabled={reading}
            onChange={(event) => {
              void readFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>
        <label>
          Session JSON
          <textarea
            className="json-input"
            rows={10}
            value={json}
            spellCheck={false}
            maxLength={131072}
            onChange={(event) => {
              setJson(event.target.value);
              setError("");
            }}
          />
        </label>
        {error && (
          <p className="error-banner" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button className="button secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="button primary"
            type="submit"
            disabled={reading || !json.trim()}
          >
            <Upload size={16} />
            Import session
          </button>
        </div>
      </form>
    </Modal>
  );
}
