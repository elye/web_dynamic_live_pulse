import {
  ArrowRight,
  Cloud,
  Download,
  Plus,
  Radio,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { IconButton } from "../../../components/IconButton";
import { exportSession } from "../../../model";
import { useHost } from "../HostContext";
import { TemplateChoices } from "./TemplateChoices";

export function LibraryPage() {
  const {
    sessions,
    setSessionId,
    setSelected,
    page,
    setPage,
    setModal,
    busy,
    search,
    setSearch,
    room,
    confirmDeleteSession,
  } = useHost();
  const isLive = !!room && !room.ended;
  return (
    <main className="library">
      <div className="page-heading">
        <div>
          <span className="eyebrow">A SPACE FOR EVERY VOICE</span>
          <h1>
            {page === "templates"
              ? "Start with a little inspiration."
              : "Your next great conversation."}
          </h1>
          <p className="muted">
            {page === "templates"
              ? "A few favorites, ready to make your own."
              : "Good questions. Real connections. All right here."}
          </p>
        </div>
        <div className="session-library-actions">
          <button
            className="button secondary"
            disabled={isLive}
            onClick={() => setModal("import")}
          >
            <Upload size={17} />
            Import JSON
          </button>
          <button
            className="button secondary"
            disabled={isLive}
            onClick={() => setModal("aiprompt")}
          >
            <Sparkles size={17} />
            Generate with AI
          </button>
          <button
            className="button primary"
            disabled={isLive}
            onClick={() => setModal("new")}
          >
            <Plus size={17} />
            New session
          </button>
        </div>
      </div>
      {isLive && (
        <div className="live-library-banner">
          <Radio size={19} />
          <span>
            <strong>{room.title}</strong> is live
          </span>
          <button className="text-button" onClick={() => setPage("studio")}>
            Back to live session
            <ArrowRight size={16} />
          </button>
        </div>
      )}
      {page === "sessions" ? (
        <>
          <div className="library-toolbar">
            <h2>
              My sessions <span>{sessions.length}</span>
            </h2>
            <label className="search-field">
              <Search size={17} />
              <input
                aria-label="Search sessions"
                placeholder="Find a session..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>
          <div className="session-grid">
            {sessions
              .filter((item) =>
                item.title.toLowerCase().includes(search.toLowerCase()),
              )
              .map((item) => (
                <article className="session-card" key={item.id}>
                  <button
                    className="session-card-open"
                    aria-label={`Open ${item.title}`}
                    disabled={isLive}
                    onClick={() => {
                      setSessionId(item.id);
                      setSelected(0);
                      setPage("studio");
                    }}
                  >
                    <div className={`session-card-art theme-${item.theme}`}>
                      <Cloud size={30} />
                      <span>{item.title}</span>
                      <span className="tiny-pulse">pulse.</span>
                    </div>
                    <div className="session-card-info">
                      <span className="draft-tag">
                        {item.hostedRooms?.some(
                          (entry) => entry.code === room?.code,
                        )
                          ? room?.ended
                            ? "ENDED"
                            : "LIVE"
                          : item.hostedRooms?.length
                            ? "HOSTED"
                            : "DRAFT"}
                      </span>
                      <h3>{item.title}</h3>
                      <p>
                        {item.questions.length} questions
                        <span>
                          Edited{" "}
                          {new Date(item.updated).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" },
                          )}
                        </span>
                      </p>
                    </div>
                  </button>
                  <div className="session-card-actions">
                    <IconButton
                      icon={Download}
                      label={`Export ${item.title} as JSON`}
                      onClick={() => exportSession(item)}
                    />
                    <IconButton
                      icon={Trash2}
                      label={`Delete ${item.title}`}
                      disabled={busy}
                      onClick={() => confirmDeleteSession(item)}
                    />
                  </div>
                </article>
              ))}
          </div>
          {!sessions.some((item) =>
            item.title.toLowerCase().includes(search.toLowerCase()),
          ) && (
            <div className="empty-page">
              <Search size={32} />
              <h2>
                {sessions.length ? "No sessions found" : "No sessions yet"}
              </h2>
              <p>
                {sessions.length
                  ? "Try a different search."
                  : "Start a new conversation."}
              </p>
            </div>
          )}
          <div className="section-heading">
            <h2>A little inspiration</h2>
            <button
              className="text-button"
              onClick={() => setPage("templates")}
            >
              All templates
              <ArrowRight size={16} />
            </button>
          </div>
          {!isLive && <TemplateChoices />}
        </>
      ) : isLive ? (
        <p className="muted">End the live session before creating another.</p>
      ) : (
        <TemplateChoices />
      )}
    </main>
  );
}
