import { FlaskConical } from "lucide-react";
import { useState } from "react";
import { Modal } from "../../../components/Modal";
import { useHost } from "../HostContext";

/** Mirrors the server limit in server/simulation.mjs. */
const maxSimulatedPlayers = 300;

export function PresentSimulatedModal() {
  const { setModal, busy, startSession } = useHost();
  const [players, setPlayers] = useState(maxSimulatedPlayers);
  return (
    <Modal title="Present with simulation" onClose={() => setModal(null)}>
      <p className="muted">
        Simulated players join at random moments during the first 10 seconds,
        then answer each question you open. Real players can still join and
        answer alongside them.
      </p>
      <div className="simulation-controls">
        <label className="simulation-count">
          Simulated players <output>{players}</output>
          <input
            aria-label="Simulated players"
            type="range"
            min={1}
            max={maxSimulatedPlayers}
            step={1}
            value={players}
            onChange={(event) => setPlayers(Number(event.target.value))}
          />
        </label>
      </div>
      <div className="modal-actions">
        <button className="button secondary" onClick={() => setModal(null)}>
          Cancel
        </button>
        <button
          className="button primary"
          disabled={busy}
          onClick={() => void startSession(players)}
        >
          <FlaskConical size={16} />
          {busy ? "Starting..." : `Present with ${players} players`}
        </button>
      </div>
    </Modal>
  );
}
