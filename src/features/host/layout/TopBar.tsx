import { ArrowLeft, ArrowUp, ChevronRight } from "lucide-react";
import { Logo } from "../../../components/Logo";
import { useHost } from "../HostContext";

export function TopBar() {
  const { page, presenting, setPresenting, room, connected, session } =
    useHost();
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
