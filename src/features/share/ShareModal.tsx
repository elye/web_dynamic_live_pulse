import { Modal } from "../../components/Modal";
import { ShareDetails } from "./ShareDetails";

export function ShareModal({
  code,
  onClose,
}: {
  code: string;
  onClose: () => void;
}) {
  return (
    <Modal title="Bring everyone together" onClose={onClose}>
      <ShareDetails code={code} />
    </Modal>
  );
}
