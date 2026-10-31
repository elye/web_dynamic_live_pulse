import {
  Check,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  ListChecks,
  Plus,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { IconButton } from "../../../components/IconButton";
import { Modal } from "../../../components/Modal";
import { icons } from "../../../constants/kinds";
import {
  createId,
  hasRevealMode,
  labels,
  newQuestion,
  type RevealMode,
} from "../../../model";
import { metaOf } from "../../../questions/ui/metaRegistry";
import { useHost } from "../HostContext";

export function QuestionRail() {
  const {
    setSelected,
    setModal,
    setInsertIndex,
    setEditing,
    setNotice,
    session,
    updateSession,
    busy,
    dragIndex,
    setDragIndex,
    dragOverIndex,
    setDragOverIndex,
    currentIndex,
    questionList,
    control,
    moveQuestion,
    room,
  } = useHost();
  const isLive = !!room && !room.ended;
  const inLobby = isLive && !room.started;
  const [selecting, setSelecting] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const selectMode = selecting && !isLive;
  const checkedIds = questionList
    .filter((item) => checked.includes(item.id))
    .map((item) => item.id);
  const allChecked =
    questionList.length > 0 && checkedIds.length === questionList.length;
  function stopSelecting() {
    setSelecting(false);
    setChecked([]);
    setConfirming(false);
  }
  const revealCheckedIds = session.questions
    .filter((item) => checkedIds.includes(item.id) && hasRevealMode(item.type))
    .map((item) => item.id);
  function setCheckedRevealMode(revealMode: RevealMode) {
    updateSession({
      questions: session.questions.map((item) =>
        revealCheckedIds.includes(item.id) ? { ...item, revealMode } : item,
      ),
    });
    setNotice(
      `${revealCheckedIds.length} ${revealCheckedIds.length === 1 ? "question" : "questions"} set to ${revealMode === "live" ? "show live" : "hide first"}`,
    );
  }
  function deleteChecked() {
    const remaining = session.questions.filter(
      (item) => !checkedIds.includes(item.id),
    );
    // A session always keeps at least one question, so deleting everything starts afresh.
    updateSession({
      questions: remaining.length ? remaining : [newQuestion("cloud")],
    });
    setSelected(0);
    setNotice(
      checkedIds.length === 1
        ? "1 question deleted"
        : `${checkedIds.length} questions deleted`,
    );
    stopSelecting();
  }
  return (
    <aside className="question-rail">
      <div className="rail-heading">
        <span>
          Questions <b>{String(questionList.length).padStart(2, "0")}</b>
        </span>
        <span className="rail-heading-actions">
          <IconButton
            icon={selectMode ? X : ListChecks}
            label={selectMode ? "Cancel selection" : "Select questions"}
            disabled={isLive || busy}
            onClick={() => (selectMode ? stopSelecting() : setSelecting(true))}
          />
          <IconButton
            icon={Plus}
            label="Add question"
            disabled={isLive || selectMode || questionList.length >= 30}
            onClick={() => {
              setInsertIndex(0);
              setModal("add");
            }}
          />
        </span>
      </div>
      {selectMode && (
        <div className="rail-selection">
          <label>
            <input
              type="checkbox"
              checked={allChecked}
              onChange={() =>
                setChecked(allChecked ? [] : questionList.map((i) => i.id))
              }
            />
            Select all
          </label>
          <span className="rail-selection-actions">
            <button
              type="button"
              className="rail-reveal-selected live"
              title="Responses appear live as people answer"
              disabled={!revealCheckedIds.length}
              onClick={() => setCheckedRevealMode("live")}
            >
              <Eye size={12} />
              Show live
            </button>
            <button
              type="button"
              className="rail-reveal-selected hidden"
              title="Hide responses until you reveal them"
              disabled={!revealCheckedIds.length}
              onClick={() => setCheckedRevealMode("onDone")}
            >
              <EyeOff size={12} />
              Hide first
            </button>
            <button
              type="button"
              className="rail-delete-selected"
              disabled={!checkedIds.length}
              onClick={() => setConfirming(true)}
            >
              <Trash2 size={12} />
              Delete{checkedIds.length ? ` (${checkedIds.length})` : ""}
            </button>
          </span>
        </div>
      )}
      <div className="question-list">
        {questionList.map((item, index) => {
          const Icon = icons[item.type];
          const { Thumbnail } = metaOf(item.type);
          const draggable = !isLive && !selectMode && questionList.length > 1;
          const isChecked = checkedIds.includes(item.id);
          const revealable = hasRevealMode(item.type);
          const showsLive = item.revealMode === "live";
          return (
            <div className="question-item" key={item.id}>
              <button
                type="button"
                aria-pressed={selectMode ? isChecked : undefined}
                className={`question-thumbnail ${!inLobby && !selectMode && index === currentIndex ? "selected" : ""} ${isChecked ? "checked" : ""} ${dragIndex === index ? "dragging" : ""} ${dragOverIndex === index && dragIndex !== null && dragIndex !== index ? "drag-over" : ""}`}
                draggable={draggable}
                aria-grabbed={dragIndex === index}
                onClick={() =>
                  selectMode
                    ? setChecked((current) =>
                        isChecked
                          ? current.filter((id) => id !== item.id)
                          : [...current, item.id],
                      )
                    : isLive
                      ? void control("select", index)
                      : setSelected(index)
                }
                onDragStart={(event) => {
                  if (!draggable) return;
                  setDragIndex(index);
                  event.dataTransfer.effectAllowed = "move";
                }}
                onDragEnter={(event) => {
                  if (dragIndex === null) return;
                  event.preventDefault();
                  setDragOverIndex(index);
                }}
                onDragOver={(event) => {
                  if (dragIndex === null) return;
                  event.preventDefault();
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (dragIndex !== null) moveQuestion(dragIndex, index);
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                disabled={busy || inLobby}
              >
                {selectMode && (
                  <span className="thumbnail-check" aria-hidden="true">
                    {isChecked && <Check size={11} strokeWidth={3} />}
                  </span>
                )}
                {draggable && (
                  <span className="thumbnail-drag-handle" aria-hidden="true">
                    <GripVertical size={13} />
                  </span>
                )}
                <span className="thumbnail-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className={`thumbnail-art art-${item.type}`}>
                  <Thumbnail />
                </div>
                <span className="thumbnail-caption">
                  <Icon size={13} />
                  {labels[item.type]}
                  {revealable && (
                    <span
                      className={`thumbnail-reveal ${showsLive ? "live" : "hidden"}`}
                      role="img"
                      aria-label={
                        showsLive
                          ? "Responses show live"
                          : "Responses hidden first"
                      }
                      title={
                        showsLive
                          ? "Responses show live"
                          : "Responses hidden until revealed"
                      }
                    >
                      {showsLive ? <Eye size={12} /> : <EyeOff size={12} />}
                    </span>
                  )}
                </span>
                <span className="thumbnail-title">{item.title}</span>
              </button>
              {!selectMode && (
                <div
                  className="question-item-actions"
                  aria-label={`Actions for question ${index + 1}`}
                >
                  <IconButton
                    icon={Plus}
                    label={`Add question after question ${index + 1}`}
                    disabled={
                      isLive || inLobby || busy || questionList.length >= 30
                    }
                    onClick={() => {
                      setInsertIndex(index + 1);
                      setModal("add");
                    }}
                  />
                  <IconButton
                    icon={Settings2}
                    label={`Customize question ${index + 1}`}
                    disabled={isLive || inLobby || busy}
                    onClick={() => setEditing(item)}
                  />
                  <IconButton
                    icon={Copy}
                    label={`Duplicate question ${index + 1}`}
                    disabled={
                      isLive || inLobby || busy || questionList.length >= 30
                    }
                    onClick={() => {
                      const questions = [...session.questions];
                      questions.splice(index + 1, 0, {
                        ...item,
                        id: createId(),
                      });
                      updateSession({ questions });
                      setSelected(index + 1);
                      setNotice("Question duplicated");
                    }}
                  />
                  <IconButton
                    icon={Trash2}
                    label={`Delete question ${index + 1}`}
                    disabled={
                      isLive || inLobby || busy || questionList.length <= 1
                    }
                    onClick={() => {
                      setSelected(index);
                      setModal("delete");
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button
        className="add-question"
        aria-label="Add question"
        disabled={isLive || selectMode || questionList.length >= 30}
        onClick={() => {
          setInsertIndex(null);
          setModal("add");
        }}
      >
        <Plus size={17} />
        Add question
      </button>
      <span className="rail-note">
        {isLive
          ? "Questions are locked while live"
          : `${questionList.length} of 30 questions`}
      </span>
      {confirming && (
        <Modal
          title={`Delete ${checkedIds.length} ${checkedIds.length === 1 ? "question" : "questions"}?`}
          onClose={() => setConfirming(false)}
        >
          <p className="muted">
            {allChecked
              ? "Every question will be removed and replaced with one blank question."
              : `The selected ${checkedIds.length === 1 ? "question" : "questions"} will be removed from this session.`}
          </p>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
            <button className="button danger" onClick={deleteChecked}>
              <Trash2 size={16} />
              Delete {checkedIds.length === 1 ? "question" : "questions"}
            </button>
          </div>
        </Modal>
      )}
    </aside>
  );
}
