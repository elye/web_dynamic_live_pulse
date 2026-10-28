import { Plus } from "lucide-react";
import { Modal } from "../../../components/Modal";
import { icons, kindGroups, kindHints } from "../../../constants/kinds";
import { labels, newQuestion } from "../../../model";
import { useHost } from "../HostContext";

export function AddQuestionModal() {
  const { setSelected, setModal, setEditing, session, updateSession } =
    useHost();
  return (
    <Modal title="What would you like to ask?" onClose={() => setModal(null)}>
      {kindGroups.map((group) => (
        <section className="question-group" key={group.title}>
          <h3>{group.title}</h3>
          <p>{group.hint}</p>
          <div className="question-types">
            {group.kinds.map((kind) => {
              const Icon = icons[kind];
              return (
                <button
                  key={kind}
                  onClick={() => {
                    const created = newQuestion(kind);
                    updateSession({
                      questions: [...session.questions, created],
                    });
                    setSelected(session.questions.length);
                    setModal(null);
                    setEditing(created);
                  }}
                >
                  <span className={`type-icon type-${kind}`}>
                    <Icon size={25} />
                  </span>
                  <span>
                    <strong>{labels[kind]}</strong>
                    <small>{kindHints[kind]}</small>
                  </span>
                  <Plus size={19} />
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </Modal>
  );
}
