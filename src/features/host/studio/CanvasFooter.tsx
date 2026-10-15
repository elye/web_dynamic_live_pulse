import { Check, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { IconButton } from "../../../components/IconButton";
import { useHost } from "../HostContext";

export function CanvasFooter() {
  const {
    busy,
    room,
    session,
    currentIndex,
    questionList,
    updateSession,
    move,
  } = useHost();
  const isLive = !!room && !room.ended;
  const inLobby = isLive && !room.started;
  return (
    <div className="canvas-footer" hidden={inLobby}>
      {isLive ? (
        <span className="audience-count">
          <Users size={17} />
          <strong>{room.participants}</strong> joined{" "}
          <span className="separator">·</span>
          <span className={room.accepting ? "live-indicator" : ""}>
            {inLobby
              ? "Welcome lobby"
              : room.accepting
                ? "Accepting responses"
                : "Responses paused"}
          </span>
        </span>
      ) : (
        <div className="theme-picker">
          <span>Slide mood</span>
          {["mint", "peach", "lilac", "sky"].map((theme) => (
            <button
              aria-label={`${theme} theme`}
              aria-pressed={session.theme === theme}
              title={`${theme} theme`}
              className={`theme-swatch theme-${theme} ${session.theme === theme ? "chosen" : ""}`}
              onClick={() => updateSession({ theme })}
              key={theme}
            >
              {session.theme === theme && <Check size={13} />}
            </button>
          ))}
        </div>
      )}
      {!inLobby && (
        <div className="slide-pagination">
          <IconButton
            icon={ChevronLeft}
            label="Previous question"
            disabled={currentIndex === 0 || busy}
            onClick={() => move(-1)}
          />
          <span>
            {currentIndex + 1}{" "}
            <span className="muted">/ {questionList.length}</span>
          </span>
          <IconButton
            icon={ChevronRight}
            label="Next question"
            disabled={currentIndex === questionList.length - 1 || busy}
            onClick={() => move(1)}
          />
        </div>
      )}
    </div>
  );
}
