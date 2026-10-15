import { Plus, Shuffle } from "lucide-react";
import { Modal } from "../../../components/Modal";
import { useHost } from "../HostContext";
import { TemplateChoices } from "../library/TemplateChoices";

export function NewSessionModal() {
  const { setModal, busy, connected, createSession } = useHost();
  return (
    <Modal
      title="A new conversation starts here"
      wide
      onClose={() => setModal(null)}
    >
      <TemplateChoices />
      <button
        className="button secondary full"
        onClick={() => createSession("blank")}
      >
        <Plus size={17} />
        Start from scratch
      </button>
      <button
        className="button secondary full"
        disabled={!connected || busy}
        onClick={() => setModal("crowd")}
      >
        <Shuffle size={17} />
        Players write the questions
      </button>
    </Modal>
  );
}
