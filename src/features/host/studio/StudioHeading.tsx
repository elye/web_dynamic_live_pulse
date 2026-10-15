import {
  CheckCheck,
  Download,
  Pencil,
  Play,
  Square,
  Trash2,
  Users,
} from "lucide-react";
import { IconButton } from "../../../components/IconButton";
import { exportSession, labels } from "../../../model";
import { useHost } from "../HostContext";

export function StudioHeading() {
  const {
    setModal,
    busy,
    room,
    connected,
    session,
    questionList,
    updateSession,
    confirmDeleteSession,
    startSession,
  } = useHost();
  const isLive = !!room && !room.ended;
  return (
    <div className="studio-heading">
      <div className="session-heading">
        <div className="session-eyebrow">
          <span className={isLive ? "live-tag" : "draft-tag"}>
            {isLive ? (
              <>
                <span />
                LIVE SESSION
              </>
            ) : (
              "DRAFT SESSION"
            )}
          </span>
          <span className="muted">
            {isLive && room.crowd && !room.started
              ? `Player-made ${labels[room.crowd.kind]} questions`
              : `${questionList.length} questions`}
          </span>
        </div>
        <div className="title-row">
          {isLive ? (
            <h1>{room.title}</h1>
          ) : (
            <input
              aria-label="Session title"
              maxLength={100}
              value={session.title}
              onChange={(event) => updateSession({ title: event.target.value })}
              onBlur={() => {
                if (!session.title.trim())
                  updateSession({ title: "Untitled session" });
              }}
            />
          )}
          {!isLive && <Pencil size={17} className="muted" />}
        </div>
        <p>A moment to connect before the next big thing.</p>
      </div>
      <div className="heading-actions">
        <IconButton
          icon={Download}
          label="Export session JSON"
          onClick={() => exportSession(session)}
        />
        <IconButton
          icon={Trash2}
          label="Delete session"
          disabled={busy}
          onClick={() => confirmDeleteSession(session)}
        />
        {isLive ? (
          <>
            <button
              className="button secondary"
              onClick={() => setModal("share")}
            >
              <Users size={17} />
              Invite audience
            </button>
            <button
              className="button danger-outline"
              onClick={() => setModal("end")}
            >
              <Square size={14} />
              End session
            </button>
          </>
        ) : (
          <>
            <span className="saved-label">
              <CheckCheck size={16} />
              Saved on this device
            </span>
            <button
              className="button primary"
              onClick={() => void startSession()}
              disabled={!connected || busy}
            >
              <Play size={16} fill="currentColor" />
              {busy ? "Starting..." : "Present live"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
