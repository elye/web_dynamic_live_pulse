import { ArrowDown, ArrowUp, Copy, Settings2, Trash2 } from "lucide-react";
import { IconButton } from "../../../components/IconButton";
import { icons } from "../../../constants/kinds";
import { createId, labels } from "../../../model";
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
          <p>
            {question.type === "cloud"
              ? "A single word from every voice."
              : question.type === "manyoptions"
                ? "Pick from a big grid of short options."
                : question.type === "poll"
                  ? "Different perspectives. One shared picture."
                  : question.type === "quiz"
                    ? "A little friendly competition."
                    : question.type === "truefalse"
                      ? "A quick binary call: true or false."
                      : question.type === "twotruths"
                        ? "Two truths and a lie. Who can spot it?"
                        : question.type === "ranking"
                          ? "Drag to sort what matters most."
                          : question.type === "slider"
                            ? "Slide to estimate a number."
                            : question.type === "qna"
                              ? "Submit and upvote live questions."
                              : question.type === "points100"
                                ? "Divide 100 points across what matters most."
                                : question.type === "grid2x2"
                                  ? "Place a point across two axes."
                                  : question.type === "peerpraise"
                                    ? "Give each player someone else to write about."
                                    : question.type === "slide"
                                      ? "Just a title and description. No input needed."
                                      : "Space for the longer answer."}
          </p>
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
