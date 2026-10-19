import {
  Drama,
  FileText,
  Grid2x2,
  GripVertical,
  ListOrdered,
  MessageCircle,
  MessageCircleQuestion,
  Percent,
  Plus,
  SlidersHorizontal,
  ToggleLeft,
  Trophy,
  Users,
} from "lucide-react";
import { IconButton } from "../../../components/IconButton";
import { icons } from "../../../constants/kinds";
import { labels } from "../../../model";
import { useHost } from "../HostContext";

export function QuestionRail() {
  const {
    setSelected,
    setModal,
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
  return (
    <aside className="question-rail">
      <div className="rail-heading">
        <span>
          Questions <b>{String(questionList.length).padStart(2, "0")}</b>
        </span>
        <IconButton
          icon={Plus}
          label="Add question"
          disabled={isLive || questionList.length >= 30}
          onClick={() => setModal("add")}
        />
      </div>
      <div className="question-list">
        {questionList.map((item, index) => {
          const Icon = icons[item.type];
          const draggable = !isLive && questionList.length > 1;
          return (
            <button
              className={`question-thumbnail ${!inLobby && index === currentIndex ? "selected" : ""} ${dragIndex === index ? "dragging" : ""} ${dragOverIndex === index && dragIndex !== null && dragIndex !== index ? "drag-over" : ""}`}
              key={item.id}
              draggable={draggable}
              aria-grabbed={dragIndex === index}
              onClick={() =>
                isLive ? void control("select", index) : setSelected(index)
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
              {draggable && (
                <span className="thumbnail-drag-handle" aria-hidden="true">
                  <GripVertical size={13} />
                </span>
              )}
              <span className="thumbnail-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className={`thumbnail-art art-${item.type}`}>
                {item.type === "cloud" ? (
                  <div className="mini-cloud">
                    <span>curious</span>
                    <b>excited</b>
                    <span>inspired</span>
                  </div>
                ) : item.type === "poll" ? (
                  <div className="mini-bars">
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                ) : item.type === "quiz" ? (
                  <Trophy size={32} strokeWidth={1.5} />
                ) : item.type === "truefalse" ? (
                  <ToggleLeft size={32} strokeWidth={1.5} />
                ) : item.type === "twotruths" ? (
                  <Drama size={32} strokeWidth={1.5} />
                ) : item.type === "ranking" ? (
                  <ListOrdered size={32} strokeWidth={1.5} />
                ) : item.type === "slider" ? (
                  <SlidersHorizontal size={32} strokeWidth={1.5} />
                ) : item.type === "qna" ? (
                  <MessageCircleQuestion size={32} strokeWidth={1.5} />
                ) : item.type === "points100" ? (
                  <Percent size={32} strokeWidth={1.5} />
                ) : item.type === "grid2x2" ? (
                  <Grid2x2 size={32} strokeWidth={1.5} />
                ) : item.type === "peerpraise" ? (
                  <Users size={32} strokeWidth={1.5} />
                ) : item.type === "slide" ? (
                  <div className="mini-slide">
                    <FileText size={26} />
                    <i />
                    <i />
                  </div>
                ) : (
                  <div className="mini-message">
                    <MessageCircle size={30} />
                    <i />
                    <i />
                  </div>
                )}
              </div>
              <span className="thumbnail-caption">
                <Icon size={13} />
                {labels[item.type]}
              </span>
              <span className="thumbnail-title">{item.title}</span>
            </button>
          );
        })}
      </div>
      <button
        className="add-question"
        aria-label="Add question"
        disabled={isLive || questionList.length >= 30}
        onClick={() => setModal("add")}
      >
        <Plus size={17} />
        Add question
      </button>
      <span className="rail-note">
        {isLive
          ? "Questions are locked while live"
          : `${questionList.length} of 30 questions`}
      </span>
    </aside>
  );
}
