import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Cloud,
  Copy,
  Download,
  Expand,
  ExternalLink,
  Eye,
  FileText,
  FlaskConical,
  FolderOpen,
  GripVertical,
  LayoutGrid,
  Link,
  LoaderCircle,
  MessageCircle,
  Monitor,
  Pause,
  Pencil,
  Play,
  Plus,
  Radio,
  Search,
  Send,
  Settings2,
  Shuffle,
  Sparkles,
  Square,
  Trash2,
  Trophy,
  Upload,
  Users,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  createId,
  exportResults,
  exportSession,
  importSession,
  labels,
  newQuestion,
  newSession,
  readStored,
  store,
} from "./model";
import type { Kind, Question, Room, Session } from "./model";
import { request, useLive } from "./live";
import WordCloud from "./WordCloud";

const icons: Record<Kind, LucideIcon> = {
  slide: FileText,
  cloud: Cloud,
  poll: BarChart3,
  quiz: Trophy,
  text: MessageCircle,
};
const kinds: Kind[] = ["slide", "cloud", "poll", "quiz", "text"];
const samples = [
  { text: "excited", count: 12 },
  { text: "curious", count: 9 },
  { text: "inspired", count: 8 },
  { text: "optimistic", count: 7 },
  { text: "energized", count: 6 },
  { text: "ready", count: 5 },
  { text: "focused", count: 4 },
  { text: "grateful", count: 3 },
  { text: "creative", count: 3 },
  { text: "hopeful", count: 2 },
  { text: "connected", count: 2 },
];

function Logo() {
  return (
    <a className="logo" href="/" aria-label="Pulse home">
      <span className="logo-symbol">
        <Zap size={24} fill="currentColor" strokeWidth={1.5} />
      </span>
      pulse<span className="logo-period">.</span>
    </a>
  );
}

function IconButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  className = "",
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`icon-button ${className}`}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon size={18} />
    </button>
  );
}

function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      onCancel={onClose}
      aria-label={title}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <IconButton icon={X} label="Close dialog" onClick={onClose} />
      </div>
      {children}
    </dialog>
  );
}

function ResultsVisual({
  question,
  preview = false,
  reveal = false,
}: {
  question: Question;
  preview?: boolean;
  reveal?: boolean;
}) {
  if (question.type === "slide") return null;
  const results = preview
    ? question.type === "cloud"
      ? samples
      : question.type === "text"
        ? [
            { text: "More time to explore ideas together.", count: 1 },
            { text: "The energy we bring as a team!", count: 1 },
          ]
        : question.options.map((text, index) => ({
            text,
            count: [8, 14, 6, 10, 4, 5][index],
          }))
    : question.results || [];
  const total = results.reduce((sum, item) => sum + item.count, 0);
  if (!preview && !total)
    return (
      <div className="response-empty">
        <span className="empty-rings">
          <Radio size={34} />
        </span>
        <h3>Waiting for the first spark</h3>
        <p>
          {question.type === "cloud"
            ? "Your audience’s words will appear here."
            : "Responses will appear here as they arrive."}
        </p>
      </div>
    );
  if (question.type === "cloud")
    return <WordCloud results={results} />;
  if (question.type === "text")
    return (
      <div className="text-results">
        {results.map((item, index) => (
          <div className="text-response" key={`${item.text}-${index}`}>
            <MessageCircle size={18} />
            <p>{item.text}</p>
            {item.count > 1 && <span>×{item.count}</span>}
          </div>
        ))}
      </div>
    );
  return (
    <div className="poll-results">
      {results.map((item, index) => (
        <div className="poll-row" key={index}>
          <div className="poll-label">
            <span>
              <b className={`option-letter color-${index % 4}`}>
                {String.fromCharCode(65 + index)}
              </b>
              {item.text}
              {reveal &&
                question.type === "quiz" &&
                question.correct === index && <Check size={18} />}
            </span>
            <strong>
              {total ? Math.round((item.count / total) * 100) : 0}%
            </strong>
          </div>
          <div className="bar-track">
            <div
              className={`bar-fill color-${index % 4}`}
              style={{ width: `${total ? (item.count / total) * 100 : 0}%` }}
            />
          </div>
          <small>{item.count} responses</small>
        </div>
      ))}
    </div>
  );
}

function QuestionStage({
  question,
  preview = false,
  theme = "mint",
  code,
  index = 0,
  total = 4,
  reveal = false,
}: {
  question: Question;
  preview?: boolean;
  theme?: string;
  code?: string;
  index?: number;
  total?: number;
  reveal?: boolean;
}) {
  const Icon = icons[question.type];
  return (
    <section className={`question-stage theme-${theme}`}>
      <div className="stage-top">
        <span className="stage-kind">
          <Icon size={15} />
          {labels[question.type]}
        </span>
        <span>
          {preview
            ? "LET’S CHECK IN"
            : code
              ? `JOIN · ${code.slice(0, 3)} ${code.slice(3)}`
              : "LIVE RESULTS"}
        </span>
      </div>
      <div className="stage-title">
        <span className="question-eyebrow">
          {question.type === "slide"
            ? "A MOMENT TOGETHER"
            : "A LITTLE CHECK-IN, A BIG CONNECTION"}
        </span>
        <h2>{question.title}</h2>
        {question.type === "cloud" && <p>One word. All the feels.</p>}
        {question.type === "slide" && (
          <p className="stage-slide-description">{question.description}</p>
        )}
      </div>
      <ResultsVisual question={question} preview={preview} reveal={reveal} />
      <div className="stage-bottom">
        <span className="stage-brand">
          <Zap size={16} fill="currentColor" /> pulse.
        </span>
        {question.type === "slide" ? (
          <span className="sample-label">
            <FileText size={12} /> No responses needed
          </span>
        ) : preview ? (
          <span className="sample-label">
            <Eye size={12} /> Sample responses
          </span>
        ) : (
          <span>
            <Users size={14} /> {question.responses || 0} responses
          </span>
        )}
        <span>
          {String(index + 1).padStart(2, "0")}{" "}
          <span className="faded">/ {String(total).padStart(2, "0")}</span>
        </span>
      </div>
    </section>
  );
}

function WelcomeLobby({ room, theme = "mint", host = false, onStart, disabled }: { room: Room; theme?: string; host?: boolean; onStart?: () => void; disabled?: boolean }) {
  return <section className={`welcome-lobby theme-${theme} ${host ? "host-lobby" : ""}`} aria-label="Welcome lobby">
    <div className="lobby-intro"><div><span className="eyebrow">{host ? "WELCOME TO THE SESSION" : room.title}</span><h1>{host ? room.title : "Welcome, everyone."}</h1><span className="lobby-waiting"><span className="live-indicator" />{host ? "The room is open" : "You're in"}</span></div>{host && <button className="button primary" disabled={disabled} onClick={onStart}><Play size={17} />Start questions</button>}</div>
    <div className="lobby-body">
      {host ? <div className="lobby-join"><h2>Join the session</h2><ShareDetails code={room.code} inline /></div> : <div className="lobby-code"><span>ROOM CODE</span><strong>{room.code.slice(0, 3)} {room.code.slice(3)}</strong></div>}
      <div className="lobby-roster">
        <div className="lobby-count" role="status" aria-label="Total participants joined"><Users size={22} /><strong>{room.participants}</strong><span>{room.participants === 1 ? "participant joined" : "participants joined"}</span></div>
        <div className="lobby-people" aria-label="Joined participants">
          {room.participantNames.length ? <ul>{room.participantNames.map((name, index) => <li key={index}><span className={`participant-initial color-${index % 4}`} aria-hidden="true">{name.slice(0, 1).toLocaleUpperCase()}</span><span>{name}</span></li>)}</ul> : <div className="lobby-empty"><Users size={32} strokeWidth={1.3} /><p>Waiting for everyone to arrive</p></div>}
        </div>
      </div>
    </div>
    <div className="lobby-footer"><span className="stage-brand"><Zap size={16} fill="currentColor" />pulse.</span><span>{host ? "Everyone in? Let's begin." : "Waiting for your host to start."}</span></div>
  </section>;
}

function QuestionEditor({
  question,
  onSave,
  onClose,
}: {
  question: Question;
  onSave: (question: Question) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(question);
  const isOptions = draft.type === "poll" || draft.type === "quiz";
  const isSlide = draft.type === "slide";
  function submit(event: FormEvent) {
    event.preventDefault();
    onSave(draft);
    onClose();
  }
  return (
    <Modal title="Edit question" onClose={onClose}>
      <form onSubmit={submit} className="editor-form">
        <label>
          Question type
          <select
            value={draft.type}
            onChange={(event) => {
              const type = event.target.value as Kind;
              setDraft({
                ...newQuestion(type),
                id: draft.id,
                title: draft.title,
              });
            }}
          >
            {kinds.map((kind) => (
              <option key={kind} value={kind}>
                {labels[kind]}
              </option>
            ))}
          </select>
        </label>
        <label>
          {isSlide ? "Title" : "Your question"}
          <textarea
            autoFocus
            required
            maxLength={200}
            value={draft.title}
            onChange={(event) =>
              setDraft({ ...draft, title: event.target.value })
            }
            rows={3}
          />
        </label>
        {isSlide && (
          <label>
            Description
            <textarea
              required
              maxLength={280}
              value={draft.description || ""}
              onChange={(event) =>
                setDraft({ ...draft, description: event.target.value })
              }
              rows={5}
              placeholder="Add the details you'd like everyone to see..."
            />
            <small className="character-count">
              {(draft.description || "").length} / 280
            </small>
          </label>
        )}
        {isOptions && (
          <fieldset>
            <legend>
              Answer options{" "}
              {draft.type === "quiz" && (
                <span>· Select the correct answer</span>
              )}
            </legend>
            {draft.options.map((option, index) => (
              <div className="option-editor" key={index}>
                {draft.type === "quiz" ? (
                  <input
                    aria-label={`Option ${index + 1} is correct`}
                    type="radio"
                    name="correct"
                    checked={draft.correct === index}
                    onChange={() => setDraft({ ...draft, correct: index })}
                  />
                ) : (
                  <span className={`option-letter color-${index % 4}`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                )}
                <input
                  aria-label={`Option ${index + 1}`}
                  required
                  maxLength={100}
                  value={option}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      options: draft.options.map((text, position) =>
                        position === index ? event.target.value : text,
                      ),
                    })
                  }
                />
                <IconButton
                  icon={X}
                  label={`Remove option ${index + 1}`}
                  disabled={draft.options.length <= 2}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      options: draft.options.filter(
                        (_, position) => position !== index,
                      ),
                      correct:
                        draft.type === "quiz"
                          ? draft.correct === index
                            ? 0
                            : draft.correct! > index
                              ? draft.correct! - 1
                              : draft.correct
                          : null,
                    })
                  }
                />
              </div>
            ))}
            {draft.options.length < 6 && (
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  setDraft({ ...draft, options: [...draft.options, ""] })
                }
              >
                <Plus size={16} />
                Add option
              </button>
            )}
          </fieldset>
        )}
        <div className="modal-actions">
          <button className="button secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="button primary"
            type="submit"
            disabled={
              !draft.title.trim() ||
              (isOptions && draft.options.some((option) => !option.trim())) ||
              (isSlide && !draft.description?.trim())
            }
          >
            <Check size={16} />
            Save question
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ShareModal({ code, onClose }: { code: string; onClose: () => void }) {
  return <Modal title="Bring everyone together" onClose={onClose}><ShareDetails code={code} /></Modal>;
}

function ShareDetails({ code, inline = false }: { code: string; inline?: boolean }) {
  const [origin, setOrigin] = useState(window.location.origin);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const linkInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (["localhost", "127.0.0.1"].includes(window.location.hostname))
      fetch("/api/network")
        .then((response) => response.json())
        .then(({ address }) => {
          if (address)
            setOrigin(
              `${window.location.protocol}//${address}:${window.location.port}`,
            );
        })
        .catch(() => {});
  }, []);
  const url = `${origin}/join?code=${code}`;
  async function copy() {
    setCopyError("");
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
      linkInput.current?.focus();
      linkInput.current?.select();
      setCopyError("Copy the link from the field below.");
    }
  }
  return (
      <div className={`share-content ${inline ? "lobby-share" : ""}`}>
        {!inline && <p className="muted">Your session is ready for company.</p>}
        <div className="qr-frame">
          <QRCodeSVG value={url} size={inline ? 208 : 180} marginSize={4} title="Join session QR code" fgColor="#183d35" level="M" />
        </div>
        <span className="eyebrow">ROOM CODE</span>
        <strong className="share-code">
          {code.slice(0, 3)} {code.slice(3)}
        </strong>
        <label className="share-link">
          <Link size={17} />
          <input
            ref={linkInput}
            aria-label="Participant link"
            value={url}
            readOnly
            onFocus={(event) => event.target.select()}
          />
          <IconButton
            icon={copied ? Check : Copy}
            label="Copy participant link"
            onClick={copy}
          />
        </label>
        <p className="copy-feedback" role="status">{copyError || (copied ? "Link copied" : "")}</p>
        <p className="muted small">
          On a local server, participants need the same Wi-Fi.
        </p>
        <a
          className={inline ? "lobby-open-link" : "button primary full"}
          href={`/join?code=${code}`}
          target="_blank"
          rel="noreferrer"
        >
          Open participant view
          <ExternalLink size={16} />
        </a>
      </div>
  );
}

function ResultsPage({ room }: { room: Room | null }) {
  return (
    <div className="results-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">THE BIG PICTURE</span>
          <h1>Every response counts.</h1>
        </div>
        {room && (
          <button
            className="button secondary"
            onClick={() => exportResults(room)}
          >
            <Download size={17} />
            Export CSV
          </button>
        )}
      </div>
      {!room ? (
        <div className="empty-page">
          <BarChart3 size={44} />
          <h2>A fresh start.</h2>
          <p>Your session results will be here after you go live.</p>
        </div>
      ) : (
        <>
          <div className="stats-band">
            <div>
              <span>Session</span>
              <strong>{room.title}</strong>
            </div>
            <div>
              <span>Participants</span>
              <strong>{room.participants}</strong>
            </div>
            <div>
              <span>Responses</span>
              <strong>
                {room.questions.reduce(
                  (sum, question) => sum + (question.responses || 0),
                  0,
                )}
              </strong>
            </div>
            <div>
              <span>Questions</span>
              <strong>{room.questions.length}</strong>
            </div>
          </div>
          {room.questions
            .filter((question) => question.type !== "slide")
            .map((question, index) => (
              <section className="result-section" key={question.id}>
                <span className="eyebrow">
                  {String(index + 1).padStart(2, "0")} /{" "}
                  {labels[question.type]}
                </span>
                <h2>{question.title}</h2>
                <ResultsVisual question={question} reveal />
              </section>
            ))}
          {room.leaderboard.some((entry) => entry.score > 0) && (
            <Leaderboard room={room} />
          )}
        </>
      )}
    </div>
  );
}

function Leaderboard({ room }: { room: Room }) {
  return (
    <section className="leaderboard">
      <Trophy size={32} />
      <h2>The leaderboard</h2>
      {room.leaderboard.map((entry, index) => (
        <div className="leader-row" key={index}>
          <b>{index + 1}</b>
          <span>{entry.name}</span>
          <strong>{entry.score.toLocaleString()} pts</strong>
        </div>
      ))}
    </section>
  );
}

function ImportSessionModal({
  onImport,
  onClose,
}: {
  onImport: (session: Session) => void;
  onClose: () => void;
}) {
  const [json, setJson] = useState("");
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  async function readFile(file?: File) {
    if (!file) return;
    setError("");
    if (file.size > 128 * 1024) {
      setError("JSON must be smaller than 128 KB.");
      return;
    }
    setReading(true);
    try {
      setJson(await file.text());
    } catch {
      setError("Could not read this file. Try again or paste its JSON.");
    } finally {
      setReading(false);
    }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      onImport(importSession(json));
    } catch (failure) {
      setError((failure as Error).message);
    }
  }
  return (
    <Modal title="Import session JSON" onClose={onClose}>
      <form className="editor-form" onSubmit={submit}>
        <label>
          JSON file
          <input
            type="file"
            accept=".json,application/json"
            disabled={reading}
            onChange={(event) => {
              void readFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>
        <label>
          Session JSON
          <textarea
            className="json-input"
            rows={10}
            value={json}
            spellCheck={false}
            maxLength={131072}
            onChange={(event) => {
              setJson(event.target.value);
              setError("");
            }}
          />
        </label>
        {error && (
          <p className="error-banner" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button className="button secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="button primary"
            type="submit"
            disabled={reading || !json.trim()}
          >
            <Upload size={16} />
            Import session
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CloudSimulator({ question, theme, onClose }: { question: Question; theme: string; onClose: () => void }) {
  const [count, setCount] = useState(60);
  const [distribution, setDistribution] = useState("popular");
  const [generation, setGeneration] = useState(0);
  const words = [
    "excited", "curious", "inspired", "optimistic", "energized", "ready",
    "focused", "grateful", "creative", "hopeful", "connected", "calm",
    "motivated", "confident", "happy", "refreshed", "thoughtful", "engaged",
    "open-minded", "supported", "learning", "growing", "together", "proud",
    "determined", "playful", "brave", "balanced", "welcomed", "resilient",
    "reflective", "recharged", "ambitious", "inquisitive", "purposeful", "relaxed",
    "in the zone", "new ideas", "team spirit", "a fresh start", "possibility", "progress",
    "collaboration", "clarity", "trust", "momentum", "discovery", "kindness",
    "joy", "adventure", "perspective", "imagination", "belonging", "patience",
    "growth", "energy", "courage", "potential", "connection", "inspiration",
  ];
  const results = Array.from({ length: count }, (_, index) => ({
    text: words[(index + generation * 13) % words.length],
    count: distribution === "equal" ? 5 : Math.max(1, Math.round(50 * Math.pow(1 - index / count, 3))),
  }));
  const responses = results.reduce((sum, word) => sum + word.count, 0);
  return (
    <Modal title="Word cloud simulator" onClose={onClose} wide>
      <div className="cloud-simulator">
        <div className="simulation-controls">
          <label className="simulation-count">Distinct words <output>{count}</output><input aria-label="Distinct words" type="range" min={10} max={60} step={10} value={count} onChange={(event) => setCount(Number(event.target.value))} /></label>
          <label>Frequency<select aria-label="Frequency distribution" value={distribution} onChange={(event) => setDistribution(event.target.value)}><option value="popular">A few popular words</option><option value="equal">Equal frequencies</option></select></label>
          <IconButton icon={Shuffle} label="Regenerate sample" onClick={() => setGeneration((current) => current + 1)} />
        </div>
        <section className={`simulation-stage theme-${theme}`} aria-label="Simulated word cloud">
          <span className="eyebrow">SIMULATED RESPONSES</span>
          <h3>{question.title}</h3>
          <WordCloud results={results} />
          <div className="simulation-summary"><span><Cloud size={15} />{count} distinct words</span><span><Users size={15} />{responses.toLocaleString()} sample responses</span></div>
        </section>
      </div>
    </Modal>
  );
}

function Host() {
  const [sessions, setSessions] = useState<Session[]>(() => {
    const saved = readStored<Session[] | null>("pulse:sessions", null);
    return Array.isArray(saved) &&
      saved.every(
        (session) =>
          Array.isArray(session.questions) && session.questions.length,
      )
      ? saved
      : [newSession()];
  });
  const [sessionId, setSessionId] = useState(() =>
    readStored<string>("pulse:selected", ""),
  );
  const [selected, setSelected] = useState(0);
  const [page, setPage] = useState<
    "studio" | "sessions" | "templates" | "results"
  >(() =>
    readStored<Session[] | null>("pulse:sessions", null)?.length === 0
      ? "sessions"
      : "studio",
  );
  const [modal, setModal] = useState<
    "add" | "share" | "new" | "help" | "end" | "delete" | "import" | "simulate" | null
  >(null);
  const [deletingSession, setDeletingSession] = useState<Session | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [emptySession] = useState(() => newSession("blank"));
  const [editing, setEditing] = useState<Question | null>(null);
  const [presenting, setPresenting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const live = useLive("host", "", restoreSessionRoom);
  const { room, connected, error, setError } = live;
  const session =
    sessions.find((item) => item.id === sessionId) ||
    sessions[0] ||
    emptySession;
  const currentIndex =
    room && !room.ended
      ? room.active
      : Math.min(selected, session.questions.length - 1);
  const question =
    room && !room.ended
      ? room.questions[room.active]
      : session.questions[currentIndex];
  const isLive = !!room && !room.ended;
  const inLobby = isLive && !room.started;
  const questionList = isLive ? room.questions : session.questions;
  useEffect(() => {
    store("pulse:sessions", sessions);
    store("pulse:selected", sessions.length ? session.id : "");
  }, [sessions, session.id]);
  function restoreSessionRoom(restoredRoom: Room) {
    const credentials = readStored<{
      code: string;
      token: string;
      sessionId?: string;
    } | null>("pulse:host", null);
    if (!credentials || credentials.sessionId) return;
    const original = sessions.find(
      (item) =>
        item.title === restoredRoom.title &&
        JSON.stringify(
          item.questions.map(({ type, title, options, correct }) => ({
            type,
            title,
            options,
            correct,
          })),
        ) ===
          JSON.stringify(
            restoredRoom.questions.map(({ type, title, options, correct }) => ({
              type,
              title,
              options,
              correct,
            })),
          ),
    );
    if (!original) return;
    store("pulse:host", { ...credentials, sessionId: original.id });
    setSessions((items) =>
      items.map((item) =>
        item.id === original.id
          ? {
              ...item,
              hostedRooms: [
                ...(item.hostedRooms || []).filter(
                  (entry) => entry.code !== credentials.code,
                ),
                { code: credentials.code, token: credentials.token },
              ],
            }
          : item,
      ),
    );
  }
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  function updateSession(changes: Partial<Session>) {
    setSessions((items) =>
      items.map((item) =>
        item.id === session.id
          ? { ...item, ...changes, updated: Date.now() }
          : item,
      ),
    );
  }
  function createSession(template: string) {
    const created = newSession(template);
    setSessions((items) => [...items, created]);
    setSessionId(created.id);
    setSelected(0);
    setPage("studio");
    setModal(null);
  }
  function confirmDeleteSession(item: Session) {
    setDeleteError("");
    setDeletingSession(item);
  }
  async function deleteSession() {
    if (!deletingSession) return;
    setBusy(true);
    setDeleteError("");
    const credentials = live.credentials();
    const hostedRooms = [...(deletingSession.hostedRooms || [])];
    if (
      credentials?.sessionId === deletingSession.id &&
      !hostedRooms.some((entry) => entry.code === credentials.code)
    )
      hostedRooms.push({ code: credentials.code, token: credentials.token });
    const deletingCurrentRoom =
      !!credentials &&
      hostedRooms.some((entry) => entry.code === credentials.code);
    try {
      if (hostedRooms.length) await request("room:delete", { hostedRooms });
      const remaining = sessions.filter(
        (item) => item.id !== deletingSession.id,
      );
      const nextId =
        session.id === deletingSession.id ? remaining[0]?.id || "" : session.id;
      store("pulse:sessions", remaining);
      store("pulse:selected", nextId);
      setSessions(remaining);
      setSessionId(nextId);
      setSelected(0);
      if (deletingCurrentRoom) {
        live.setRoom(null);
        live.saveCredentials(null);
      }
      setDeletingSession(null);
      setPresenting(false);
      setPage("sessions");
      setNotice("Session deleted");
    } catch (failure) {
      setDeleteError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function startSession() {
    setBusy(true);
    setError("");
    try {
      const reply = await request("room:create", {
        title: session.title,
        questions: session.questions,
      });
      const credentials = { code: reply.state!.code, token: reply.token! };
      live.saveCredentials({ ...credentials, sessionId: session.id });
      updateSession({
        hostedRooms: [...(session.hostedRooms || []), credentials],
      });
      live.setRoom(reply.state!);
      setSelected(0);
      setPresenting(true);
      setModal(null);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function control(action: string, index?: number) {
    setBusy(true);
    setError("");
    try {
      const reply = await request("room:control", {
        ...live.credentials(),
        action,
        index,
      });
      live.setRoom(reply.state!);
      if (action === "end") {
        setPresenting(false);
        setPage("results");
        setModal(null);
      }
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function move(direction: number) {
    const destination = currentIndex + direction;
    if (destination < 0 || destination >= questionList.length) return;
    if (isLive) void control("select", destination);
    else setSelected(destination);
  }
  function reorder(direction: number) {
    const destination = currentIndex + direction;
    if (destination < 0 || destination >= session.questions.length) return;
    const questions = [...session.questions];
    [questions[currentIndex], questions[destination]] = [
      questions[destination],
      questions[currentIndex],
    ];
    updateSession({ questions });
    setSelected(destination);
  }
  function moveQuestion(from: number, to: number) {
    if (
      from === to ||
      from < 0 ||
      to < 0 ||
      from >= session.questions.length ||
      to >= session.questions.length
    )
      return;
    const questions = [...session.questions];
    const [moved] = questions.splice(from, 1);
    questions.splice(to, 0, moved);
    updateSession({ questions });
    setSelected(to);
  }
  const templateChoices = (
    <div className="template-grid">
      <button
        className="template-choice checkin"
        onClick={() => createSession("checkin")}
      >
        <span className="template-art">
          <Cloud size={48} />
          <span>hello, team.</span>
        </span>
        <div>
          <span className="eyebrow">CONNECTION</span>
          <h3>Team check-in</h3>
          <p>
            4 questions <span>·</span> Word cloud, poll + more
          </p>
          <ArrowUp className="tilted-arrow" size={20} />
        </div>
      </button>
      <button
        className="template-choice trivia"
        onClick={() => createSession("trivia")}
      >
        <span className="template-art">
          <Trophy size={48} />
          <span>big brain energy.</span>
        </span>
        <div>
          <span className="eyebrow">A LITTLE COMPETITION</span>
          <h3>The big team quiz</h3>
          <p>
            3 questions <span>·</span> Quiz + word cloud
          </p>
          <ArrowUp className="tilted-arrow" size={20} />
        </div>
      </button>
      <button
        className="template-choice retro"
        onClick={() => createSession("retro")}
      >
        <span className="template-art">
          <MessageCircle size={48} />
          <span>let’s talk about it.</span>
        </span>
        <div>
          <span className="eyebrow">REFLECTION</span>
          <h3>Sprint retrospective</h3>
          <p>
            4 questions <span>·</span> Open response + more
          </p>
          <ArrowUp className="tilted-arrow" size={20} />
        </div>
      </button>
    </div>
  );

  return (
    <div className={`app-shell ${presenting ? "presentation-shell" : ""}`}>
      {!presenting && (
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
              className={
                page === "studio" || page === "sessions" ? "active" : ""
              }
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
      )}
      <div className="app-main">
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
        {!connected && (
          <div className="connection-banner">
            <WifiOff size={16} />
            Connecting to the live server. Your draft is saved on this device.
          </div>
        )}
        {error && (
          <div className="error-banner" role="alert">
            {error}
            <IconButton
              icon={X}
              label="Dismiss error"
              onClick={() => setError("")}
            />
          </div>
        )}
        {notice && (
          <div className="toast" role="status">
            <Check size={17} />
            {notice}
          </div>
        )}
        {(page === "studio" && sessions.length > 0) || presenting ? (
          <main className={`studio ${presenting ? "presenting" : ""}`}>
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
                  <span className="muted">{questionList.length} questions</span>
                </div>
                <div className="title-row">
                  {isLive ? (
                    <h1>{room.title}</h1>
                  ) : (
                    <input
                      aria-label="Session title"
                      maxLength={100}
                      value={session.title}
                      onChange={(event) =>
                        updateSession({ title: event.target.value })
                      }
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
                      onClick={startSession}
                      disabled={!connected || busy}
                    >
                      <Play size={16} fill="currentColor" />
                      {busy ? "Starting..." : "Present live"}
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="editor-layout">
              {!presenting && (
                <aside className="question-rail">
                  <div className="rail-heading">
                    <span>
                      Questions{" "}
                      <b>{String(questionList.length).padStart(2, "0")}</b>
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
                            isLive
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
              )}
              <div className="canvas-column">
                <div className="canvas-toolbar">
                  <div className="view-tabs">
                    <span className="selected">
                      <Monitor size={16} />
                      {isLive ? "Live view" : "Slide preview"}
                    </span>
                  </div>
                  <div className="canvas-tools">
                    {!isLive && question.type === "cloud" && <IconButton icon={FlaskConical} label="Simulate word cloud" onClick={() => setModal("simulate")} />}
                    {!isLive && (
                      <button
                        className="text-button"
                        onClick={() => setEditing(question)}
                      >
                        <Pencil size={14} />
                        Edit question
                      </button>
                    )}
                    <IconButton
                      icon={Expand}
                      label={
                        presenting ? "Exit presentation view" : "Expand preview"
                      }
                      onClick={() => setPresenting(!presenting)}
                    />
                  </div>
                </div>
                {modal === "simulate" && <CloudSimulator question={question} theme={session.theme} onClose={() => setModal(null)} />}
                {inLobby ? <WelcomeLobby room={room} theme={session.theme} host disabled={busy || !connected} onStart={() => void control("start")} /> : <QuestionStage
                  question={question}
                  preview={!isLive}
                  theme={session.theme}
                  code={isLive ? room.code : undefined}
                  index={currentIndex}
                  total={questionList.length}
                  reveal={room?.revealed}
                />}
                <div className="canvas-footer" hidden={inLobby}>
                  {isLive ? (
                    <span className="audience-count">
                      <Users size={17} />
                      <strong>{room.participants}</strong> joined{" "}
                      <span className="separator">·</span>
                      <span className={room.accepting ? "live-indicator" : ""}>
                        {inLobby ? "Welcome lobby" : room.accepting
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
                  {!inLobby && <div className="slide-pagination">
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
                      disabled={
                        currentIndex === questionList.length - 1 || busy
                      }
                      onClick={() => move(1)}
                    />
                  </div>}
                </div>
                {inLobby ? null : isLive ? (
                  <div className="live-controls">
                    {question.type !== "slide" && (
                      <button
                        className="button secondary"
                        onClick={() => void control("toggle")}
                        disabled={busy}
                      >
                        {room.accepting ? (
                          <Pause size={16} />
                        ) : (
                          <Play size={16} />
                        )}
                        {room.accepting ? "Pause responses" : "Reopen responses"}
                      </button>
                    )}
                    {question.type !== "slide" && (
                      <button
                        className="button secondary"
                        onClick={() => void control("reveal")}
                        disabled={room.revealed || busy}
                      >
                        <Eye size={17} />
                        {room.revealed ? "Results revealed" : "Reveal results"}
                      </button>
                    )}
                    <button
                      className="button primary"
                      onClick={() =>
                        currentIndex === questionList.length - 1
                          ? setModal("end")
                          : move(1)
                      }
                      disabled={busy}
                    >
                      {currentIndex === questionList.length - 1
                        ? "Finish session"
                        : "Next question"}
                      <ArrowRight size={17} />
                    </button>
                  </div>
                ) : (
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
                            : question.type === "poll"
                              ? "Different perspectives. One shared picture."
                              : question.type === "quiz"
                                ? "A little friendly competition."
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
                )}
                {!presenting && (
                  <div className="studio-bottom">
                    <span>
                      <span className="sparkle-tile">
                        <Sparkles size={16} />
                      </span>
                      A good question is where it all begins.
                    </span>
                    <button
                      className="text-button"
                      onClick={() => setPage("templates")}
                    >
                      Explore templates
                      <ArrowRight size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </main>
        ) : page === "results" ? (
          <ResultsPage room={room} />
        ) : (
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
                <button
                  className="text-button"
                  onClick={() => setPage("studio")}
                >
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
                          <div
                            className={`session-card-art theme-${item.theme}`}
                          >
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
                      {sessions.length
                        ? "No sessions found"
                        : "No sessions yet"}
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
                {!isLive && templateChoices}
              </>
            ) : isLive ? (
              <p className="muted">
                End the live session before creating another.
              </p>
            ) : (
              templateChoices
            )}
          </main>
        )}
        <footer className="app-footer">
          <span>Made for the moments that bring us together.</span>
          <span>
            <span className="footer-dot" /> A little more human. A little more
            pulse.
          </span>
        </footer>
      </div>
      {editing && (
        <QuestionEditor
          question={editing}
          onClose={() => setEditing(null)}
          onSave={(updated) => {
            updateSession({
              questions: session.questions.map((item) =>
                item.id === updated.id ? updated : item,
              ),
            });
            setNotice("Question saved");
          }}
        />
      )}
      {modal === "import" && (
        <ImportSessionModal
          onClose={() => setModal(null)}
          onImport={(imported) => {
            setSessions((items) => [...items, imported]);
            setSessionId(imported.id);
            setSelected(0);
            setSearch("");
            setPage("studio");
            setModal(null);
            setNotice("Session imported");
          }}
        />
      )}
      {deletingSession && (
        <Modal
          title="Delete entire session?"
          onClose={() => {
            if (!busy) setDeletingSession(null);
          }}
        >
          <p className="muted delete-session-warning">
            Delete "{deletingSession.title}" and all its questions? Any linked
            live rooms and responses will also be deleted, and connected
            participants will be removed. This cannot be undone.
          </p>
          {deleteError && (
            <p className="error-banner" role="alert">
              {deleteError}
            </p>
          )}
          <div className="modal-actions session-delete-actions">
            <button
              className="button secondary"
              onClick={() => exportSession(deletingSession)}
            >
              <Download size={16} />
              Export JSON
            </button>
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setDeletingSession(null)}
            >
              Cancel
            </button>
            <button
              className="button danger"
              disabled={busy}
              onClick={() => void deleteSession()}
            >
              <Trash2 size={16} />
              {busy ? "Deleting..." : "Delete session"}
            </button>
          </div>
        </Modal>
      )}
      {modal === "add" && (
        <Modal
          title="What would you like to ask?"
          onClose={() => setModal(null)}
        >
          <div className="question-types">
            {kinds.map((kind) => {
              const Icon = icons[kind];
              return (
                <button
                  key={kind}
                  onClick={() => {
                    const created = newQuestion(kind);
                    updateSession({
                      questions: [...session.questions, created],
                    });
                    setSelected(session.questions.length);
                    setModal(null);
                    setEditing(created);
                  }}
                >
                  <span className={`type-icon type-${kind}`}>
                    <Icon size={25} />
                  </span>
                  <span>
                    <strong>{labels[kind]}</strong>
                    <small>
                      {kind === "cloud"
                        ? "One word, a whole room of perspectives"
                        : kind === "poll"
                          ? "Let everyone pick their favorite"
                          : kind === "quiz"
                            ? "A correct answer and a little competition"
                            : kind === "slide"
                              ? "Just a title and description, no input needed"
                              : "Give every thought a little room"}
                    </small>
                  </span>
                  <Plus size={19} />
                </button>
              );
            })}
          </div>
        </Modal>
      )}
      {modal === "share" && room && (
        <ShareModal code={room.code} onClose={() => setModal(null)} />
      )}
      {modal === "new" && (
        <Modal
          title="A new conversation starts here"
          wide
          onClose={() => setModal(null)}
        >
          {templateChoices}
          <button
            className="button secondary full"
            onClick={() => createSession("blank")}
          >
            <Plus size={17} />
            Start from scratch
          </button>
        </Modal>
      )}
      {modal === "end" && (
        <Modal title="Ready to wrap up?" onClose={() => setModal(null)}>
          <p className="muted">
            This will close voting for everyone. You can review and export all
            responses afterward.
          </p>
          <div className="modal-actions">
            <button className="button secondary" onClick={() => setModal(null)}>
              Keep going
            </button>
            <button
              className="button primary"
              disabled={busy}
              onClick={() => void control("end")}
            >
              <Check size={16} />
              End session
            </button>
          </div>
        </Modal>
      )}
      {modal === "delete" && (
        <Modal title="Delete this question?" onClose={() => setModal(null)}>
          <p className="muted">
            “{question.title}” will be removed from this session.
          </p>
          <div className="modal-actions">
            <button className="button secondary" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button
              className="button danger"
              onClick={() => {
                updateSession({
                  questions: session.questions.filter(
                    (item) => item.id !== question.id,
                  ),
                });
                setSelected(Math.max(0, currentIndex - 1));
                setModal(null);
              }}
            >
              <Trash2 size={16} />
              Delete question
            </button>
          </div>
        </Modal>
      )}
      {modal === "help" && (
        <Modal title="A little help" onClose={() => setModal(null)}>
          <div className="help-content">
            <h3>Before you go live</h3>
            <p>
              Edit a question, pick your slide mood, and select Present live.
              Drafts save automatically on this device.
            </p>
            <h3>Get everyone in the room</h3>
            <p>
              Share the six-digit room code or QR link. On a local server,
              everyone needs to be on the same Wi-Fi.
            </p>
            <h3>You set the pace</h3>
            <p>
              Pause responses, reveal results, and advance questions. Quiz
              answers earn 1,000 points each. Export responses from Results.
            </p>
            <h3>A note on storage</h3>
            <p>
              Live rooms last up to 24 hours and reset when the server restarts.
              Export results before stopping the server. This workspace has no
              account or cloud sync.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Participant() {
  const initialCode =
    new URLSearchParams(window.location.search).get("code") || "";
  const [code, setCode] = useState(initialCode);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<string | number>("");
  const [answerQuestion, setAnswerQuestion] = useState("");
  const live = useLive("audience", initialCode);
  const { room, connected, error, setError, submitted } = live;
  const question = room?.questions[room.active];
  const currentAnswer = answerQuestion === question?.id ? answer : "";
  const hasSubmitted = !!question && submitted.includes(question.id);

  async function join(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const saved = readStored<{ token?: string }>(
        `pulse:participant:${code}`,
        {},
      );
      const reply = await request("room:join", {
        code,
        name,
        token: saved.token,
      });
      store(`pulse:participant:${code}`, { code, name, token: reply.token });
      window.location.assign(`/join?code=${code}`);
    } catch (failure) {
      setError((failure as Error).message);
      setBusy(false);
    }
  }
  async function vote(event: FormEvent) {
    event.preventDefault();
    if (!question || !room) return;
    setBusy(true);
    setError("");
    try {
      await request("room:vote", {
        ...live.credentials(),
        questionId: question.id,
        value: currentAnswer,
      });
      live.setSubmitted((items) => [...items, question.id]);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="participant-shell">
      <header className="participant-header">
        <Logo />
        <span className={`connection ${connected ? "" : "offline"}`}>
          <span />
          {connected ? "Connected" : "Reconnecting..."}
        </span>
      </header>
      {error && (
        <div className="error-banner" role="alert">
          {error}
          <IconButton
            icon={X}
            label="Dismiss error"
            onClick={() => setError("")}
          />
        </div>
      )}
      {!room ? (
        <main className="join-page">
          <div className="join-decoration">
            <span className="join-shape">
              <MessageCircle size={45} />
            </span>
            <span className="join-spark">
              <Sparkles size={32} />
            </span>
            <span className="join-check">
              <Check size={27} />
            </span>
          </div>
          <span className="eyebrow">THE ROOM IS BETTER WITH YOU</span>
          <h1>
            You’re in good
            <br />
            <span>company.</span>
          </h1>
          <p>One room. Every voice.</p>
          <form onSubmit={join} className="join-form">
            <label>
              Room code
              <input
                autoFocus
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                minLength={6}
                required
                placeholder="000 000"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="code-input"
              />
            </label>
            <label>
              Your name
              <input
                required
                maxLength={24}
                placeholder="What should we call you?"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="given-name"
              />
            </label>
            <button
              className="button primary full"
              disabled={busy || !connected || !name.trim() || code.length !== 6}
            >
              {busy ? (
                <LoaderCircle size={18} className="spin" />
              ) : (
                <>
                  Join the room
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          <a href="/" className="host-link">
            Hosting instead?
            <span>
              Open your workspace <ArrowUp size={14} className="tilted-arrow" />
            </span>
          </a>
        </main>
      ) : room.ended ? (
        <main className="participant-finish">
          <span className="finish-icon">
            <CheckCheck size={42} />
          </span>
          <span className="eyebrow">THAT’S A WRAP</span>
          <h1>
            Good things happen
            <br />
            when you show up.
          </h1>
          <p>Thanks for being part of {room.title}.</p>
          {room.leaderboard.some((entry) => entry.score > 0) && (
            <Leaderboard room={room} />
          )}
          <a className="button primary" href="/join">
            Join another session
            <ArrowRight size={17} />
          </a>
        </main>
      ) : !room.started ? (
        <main className="participant-lobby"><WelcomeLobby room={room} /></main>
      ) : (
        question && (
          <main className="participant-session">
            <div className="participant-room">
              <span>{room.title}</span>
              <span>
                {room.code.slice(0, 3)} {room.code.slice(3)}
              </span>
            </div>
            <div className="participant-progress">
              {room.questions.map((item, index) => (
                <span
                  key={item.id}
                  className={index <= room.active ? "complete" : ""}
                />
              ))}
            </div>
            <span className="eyebrow">
              QUESTION {room.active + 1} OF {room.questions.length} ·{" "}
              {labels[question.type]}
            </span>
            <h1>{question.title}</h1>
            {question.type === "slide" ? (
              <div className="participant-slide">
                <FileText size={38} />
                <p>{question.description}</p>
                <p className="waiting-note">
                  Sit back for a moment. Your host will continue shortly.
                </p>
              </div>
            ) : room.revealed ? (
              <div className="participant-reveal">
                <span className="result-tag">
                  <BarChart3 size={15} />
                  The results are in
                </span>
                <ResultsVisual question={question} reveal />
                {question.type === "quiz" && (
                  <div className="correct-answer">
                    <Check size={20} />
                    Correct answer: {question.options[question.correct!]}
                  </div>
                )}
                <p className="waiting-note">
                  A moment to take it in. Your host will continue shortly.
                </p>
              </div>
            ) : hasSubmitted ? (
              <div className="submitted-state">
                <span>
                  <CheckCheck size={43} />
                </span>
                <h2>Your voice is in.</h2>
                <p>Let’s see what everyone thinks.</p>
                <div className="waiting-dots">
                  <i />
                  <i />
                  <i />
                </div>
                <small>Waiting for your host</small>
              </div>
            ) : !room.accepting ? (
              <div className="submitted-state">
                <Pause size={40} />
                <h2>A little pause.</h2>
                <p>Your host has paused responses.</p>
              </div>
            ) : (
              <form onSubmit={vote} className="answer-form">
                {question.type === "poll" || question.type === "quiz" ? (
                  <div className="answer-options">
                    {question.options.map((option, index) => (
                      <button
                        type="button"
                        key={index}
                        className={`answer-option ${currentAnswer === index ? "chosen" : ""}`}
                        onClick={() => {
                          setAnswer(index);
                          setAnswerQuestion(question.id);
                        }}
                        aria-pressed={currentAnswer === index}
                      >
                        <span className={`option-letter color-${index % 4}`}>
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span>{option}</span>
                        {currentAnswer === index && <Check size={20} />}
                      </button>
                    ))}
                  </div>
                ) : (
                  <label>
                    {question.type === "cloud"
                      ? "Your word or short phrase"
                      : "Your thoughts"}
                    <textarea
                      rows={question.type === "cloud" ? 2 : 5}
                      maxLength={question.type === "cloud" ? 30 : 280}
                      required
                      placeholder={
                        question.type === "cloud"
                          ? "First thing that comes to mind..."
                          : "There are no wrong answers..."
                      }
                      value={String(currentAnswer)}
                      onChange={(event) => {
                        setAnswer(event.target.value);
                        setAnswerQuestion(question.id);
                      }}
                    />
                    <small className="character-count">
                      {String(currentAnswer).length} /{" "}
                      {question.type === "cloud" ? 30 : 280}
                    </small>
                  </label>
                )}
                <button
                  className="button primary full"
                  disabled={
                    busy ||
                    !connected ||
                    currentAnswer === "" ||
                    (typeof currentAnswer === "string" && !currentAnswer.trim())
                  }
                >
                  {busy ? (
                    <LoaderCircle className="spin" size={18} />
                  ) : (
                    <>
                      <Send size={17} />
                      Send response
                    </>
                  )}
                </button>
              </form>
            )}
            <div className="participant-bottom">
              <span>
                <Users size={15} />
                {room.participants} in the room
              </span>
              <span>
                <span className="live-dot" />
                Live together
              </span>
            </div>
          </main>
        )
      )}
      <footer className="participant-footer">
        A little more human. A little more pulse.
      </footer>
    </div>
  );
}

export default function Pulse() {
  return window.location.pathname.startsWith("/join") ? (
    <Participant />
  ) : (
    <Host />
  );
}
