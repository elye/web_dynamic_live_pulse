import {
  ArrowLeft,
  ArrowUp,
  ChevronRight,
  Maximize,
  Minimize,
} from "lucide-react";
import { Logo } from "../../../components/Logo";
import { IconButton } from "../../../components/IconButton";
import { useHost } from "../HostContext";
import { MusicVolume } from "../studio/MusicVolume";

export function TopBar() {
  const {
    page,
    presenting,
    setPresenting,
    fullscreen,
    presentFullscreen,
    room,
    connected,
    session,
  } = useHost();
  return (
    <header className="topbar">
      {presenting ? (
        <>
          <Logo />
          <span className="presentation-title">
            {room?.title || session.title}
          </span>
        </>
      ) : (
        <div className="breadcrumb">
          <span>Workspace</span>
          <ChevronRight size={14} />
          <strong>
            {page === "studio"
              ? "Session studio"
              : page === "sessions"
                ? "My sessions"
                : page === "templates"
                  ? "Templates"
                  : "Results"}
          </strong>
        </div>
      )}
      <div className="topbar-actions">
        <span className={`connection ${connected ? "" : "offline"}`}>
          <span />
          {connected ? "All systems ready" : "Reconnecting..."}
        </span>
        {presenting && room && !room.ended && <MusicVolume />}
        {presenting && fullscreen.supported && (
          <IconButton
            icon={fullscreen.fullscreen ? Minimize : Maximize}
            label={fullscreen.fullscreen ? "Exit full screen" : "Full screen"}
            onClick={presentFullscreen}
          />
        )}
        {presenting ? (
          <button
            className="button secondary small-button"
            onClick={() => setPresenting(false)}
          >
            <ArrowLeft size={15} />
            Back to studio
          </button>
        ) : (
          <a className="join-link" href="/join">
            Join a session
            <ArrowUp className="tilted-arrow" size={16} />
          </a>
        )}
        <span className="topbar-avatar">Y</span>
      </div>
    </header>
  );
}
