import { ArrowDown, ArrowUp, Copy, Settings2, Trash2 } from "lucide-react";
import { IconButton } from "../../../components/IconButton";
import { icons } from "../../../constants/kinds";
import { createId, labels } from "../../../model";
import { definitionOf } from "../../../questions";
import { useHost } from "../HostContext";

export function QuestionDetails() {
  const {
    setSelected,
    setModal,
    setEditing,
    setNotice,
    session,
    currentIndex,
    question,
    questionList,
    updateSession,
    reorder,
  } = useHost();
  return (
    <div className="question-details">
      <div className="detail-title">
        <span className={`type-icon type-${question.type}`}>
          {(() => {
            const Icon = icons[question.type];
            return <Icon size={21} />;
          })()}
        </span>
        <div>
          <h3>{labels[question.type]}</h3>
          <p>{definitionOf(question.type).tagline}</p>
        </div>
      </div>
      <div className="detail-actions">
        <IconButton
          icon={ArrowUp}
          label="Move question up"
          disabled={currentIndex === 0}
          onClick={() => reorder(-1)}
        />
        <IconButton
          icon={ArrowDown}
          label="Move question down"
          disabled={currentIndex === questionList.length - 1}
          onClick={() => reorder(1)}
        />
        <IconButton
          icon={Copy}
          label="Duplicate question"
          disabled={questionList.length >= 30}
          onClick={() => {
            const questions = [...session.questions];
            questions.splice(currentIndex + 1, 0, {
              ...question,
              id: createId(),
            });
            updateSession({ questions });
            setSelected(currentIndex + 1);
            setNotice("Question duplicated");
          }}
        />
        <IconButton
          icon={Trash2}
          label="Delete question"
          disabled={questionList.length <= 1}
          onClick={() => setModal("delete")}
        />
        <button
          className="button secondary small-button"
          onClick={() => setEditing(question)}
        >
          <Settings2 size={15} />
          Customize
        </button>
      </div>
    </div>
  );
}
