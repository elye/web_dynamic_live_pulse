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
                    <small>
                      {kind === "cloud"
                        ? "One word, a whole room of perspectives"
                        : kind === "manyoptions"
                          ? kindHints.manyoptions
                          : kind === "poll"
                            ? "Let everyone pick their favorite"
                            : kind === "quiz"
                              ? "A correct answer and a little competition"
                              : kind === "truefalse"
                                ? "A binary choice: true or false"
                                : kind === "twotruths"
                                  ? kindHints.twotruths
                                  : kind === "ranking"
                                    ? "Drag to sort items from most to least important"
                                    : kind === "slider"
                                      ? "Estimate a numeric value on a sliding scale"
                                      : kind === "qna"
                                        ? "Participants submit and upvote live questions"
                                        : kind === "points100"
                                          ? "Allocate 100 points across a set of options to show priorities"
                                          : kind === "grid2x2"
                                            ? "Rate items across a two-axis graph"
                                            : kind === "peerpraise"
                                              ? kindHints.peerpraise
                                              : kind === "slide"
                                                ? "Just a title and description, no input needed"
                                                : "Give every thought a little room"}
                    </small>
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
