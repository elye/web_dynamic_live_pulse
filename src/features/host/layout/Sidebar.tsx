import {
  BarChart3,
  ChevronDown,
  CircleHelp,
  ExternalLink,
  FolderOpen,
  LayoutGrid,
  Sparkles,
} from "lucide-react";
import { Logo } from "../../../components/Logo";
import { useHost } from "../HostContext";

export function Sidebar() {
  const { sessions, page, setPage, setModal } = useHost();
  return (
    <aside className="sidebar">
      <Logo />
      <button
        className="workspace-switch"
        onClick={() => setPage("sessions")}
        aria-label="My workspace"
      >
        <span className="workspace-avatar">S</span>
        <span>
          My workspace<small>Personal workspace</small>
        </span>
        <ChevronDown size={15} />
      </button>
      <span className="nav-caption">WORKSPACE</span>
      <nav>
        <button
          aria-label="My sessions"
          className={page === "studio" || page === "sessions" ? "active" : ""}
          onClick={() => setPage("sessions")}
        >
          <FolderOpen size={19} />
          My sessions<span className="nav-count">{sessions.length}</span>
        </button>
        <button
          aria-label="Templates"
          className={page === "templates" ? "active" : ""}
          onClick={() => setPage("templates")}
        >
          <LayoutGrid size={19} />
          Templates<span className="new-tag">NEW</span>
        </button>
        <button
          aria-label="Results"
          className={page === "results" ? "active" : ""}
          onClick={() => setPage("results")}
        >
          <BarChart3 size={19} />
          Results
        </button>
      </nav>
      <div className="sidebar-bottom">
        <div className="workspace-photo">
          <img
            src="/team-workshop.jpg"
            alt="A team collaborating around a table"
          />
          <span>
            Good things happen
            <br />
            when everyone joins in.
          </span>
          <span className="photo-mark">
            <Sparkles size={20} />
          </span>
        </div>
        <button className="help-link" onClick={() => setModal("help")}>
          <CircleHelp size={18} />A little help
          <ExternalLink size={14} />
        </button>
        <div className="profile">
          <span className="profile-avatar">Y</span>
          <div>
            Your workspace<small>Make it a conversation.</small>
          </div>
          <span className="profile-dot" />
        </div>
      </div>
    </aside>
  );
}
