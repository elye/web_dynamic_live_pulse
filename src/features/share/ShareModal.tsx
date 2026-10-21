import { Modal } from "../../components/Modal";
import { ShareDetails } from "./ShareDetails";

export function ShareModal({
  code,
  nameless = false,
  onClose,
}: {
  code: string;
  nameless?: boolean;
  onClose: () => void;
}) {
  return (
    <Modal title="Bring everyone together" onClose={onClose}>
      <ShareDetails code={code} nameless={nameless} />
    </Modal>
  );
}
