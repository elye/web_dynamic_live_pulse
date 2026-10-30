import { Modal } from "../../../components/Modal";
import { useHost } from "../HostContext";

export function HelpModal() {
  const { setModal } = useHost();
  return (
    <Modal title="A little help" onClose={() => setModal(null)}>
      <div className="help-content">
        <h3>Before you go live</h3>
        <p>
          Edit a question, pick your slide mood, and select Present live. Drafts
          save automatically on this device.
        </p>
        <h3>Get everyone in the room</h3>
        <p>
          Share the six-digit room code or QR link. On a local server, everyone
          needs to be on the same Wi-Fi.
        </p>
        <h3>You set the pace</h3>
        <p>
          Pause responses, reset a question, reveal results, and advance
          questions. Correct answers earn up to 1,000 points, and faster answers
          earn more. Export responses from Results.
        </p>
        <h3>A note on storage</h3>
        <p>
          Live rooms last up to 24 hours and reset when the server restarts.
          Export results before stopping the server. This workspace has no
          account or cloud sync.
        </p>
      </div>
    </Modal>
  );
}
