import { QuestionEditor } from "../editor/QuestionEditor";
import { AiPromptModal } from "../sessions/AiPromptModal";
import { ImportSessionModal } from "../sessions/ImportSessionModal";
import { ShareModal } from "../share/ShareModal";
import { useHost } from "./HostContext";
import { AddQuestionModal } from "./modals/AddQuestionModal";
import { CrowdModal } from "./modals/CrowdModal";
import { DeleteQuestionModal } from "./modals/DeleteQuestionModal";
import { DeleteSessionModal } from "./modals/DeleteSessionModal";
import { EndSessionModal } from "./modals/EndSessionModal";
import { HelpModal } from "./modals/HelpModal";
import { NewSessionModal } from "./modals/NewSessionModal";

export function HostModals() {
  const {
    setSessions,
    setSessionId,
    setSelected,
    setPage,
    modal,
    setModal,
    deletingSession,
    editing,
    setEditing,
    setSearch,
    setNotice,
    room,
    session,
    updateSession,
  } = useHost();
  return (
    <>
      {editing && (
        <QuestionEditor
          question={editing}
          onClose={() => setEditing(null)}
          onSave={(updated) => {
            updateSession({
              questions: session.questions.map((item) =>
                item.id === updated.id ? updated : item,
              ),
            });
            setNotice("Question saved");
          }}
        />
      )}
      {modal === "aiprompt" && (
        <AiPromptModal
          onClose={() => setModal(null)}
          onImportNext={() => setModal("import")}
        />
      )}
      {modal === "import" && (
        <ImportSessionModal
          onClose={() => setModal(null)}
          onImport={(imported) => {
            setSessions((items) => [...items, imported]);
            setSessionId(imported.id);
            setSelected(0);
            setSearch("");
            setPage("studio");
            setModal(null);
            setNotice("Session imported");
          }}
        />
      )}
      {deletingSession && <DeleteSessionModal />}
      {modal === "add" && <AddQuestionModal />}
      {modal === "crowd" && <CrowdModal />}
      {modal === "share" && room && (
        <ShareModal
          code={room.code}
          nameless={room.nameless}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "new" && <NewSessionModal />}
      {modal === "end" && <EndSessionModal />}
      {modal === "delete" && <DeleteQuestionModal />}
      {modal === "help" && <HelpModal />}
    </>
  );
}
