import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode, RefObject } from "react";
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
  Grid2x2,
  Heart,
  GripVertical,
  LayoutGrid,
  Link,
  ListOrdered,
  LoaderCircle,
  MessageCircle,
  MessageCircleQuestion,
  Monitor,
  Pause,
  Pencil,
  Percent,
  Play,
  Plus,
  QrCode,
  Radio,
  Search,
  Send,
  Settings2,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Square,
  ToggleLeft,
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
  hasRevealMode,
  canCompete,
} from "./model";
import type { Kind, Question, Room, Session } from "./model";
import { onHeart, request, useLive } from "./live";
import WordCloud from "./WordCloud";

const icons: Record<Kind, LucideIcon> = {
  slide: FileText,
  cloud: Cloud,
  poll: BarChart3,
  quiz: Trophy,
  truefalse: ToggleLeft,
  ranking: ListOrdered,
  slider: SlidersHorizontal,
  qna: MessageCircleQuestion,
  points100: Percent,
  grid2x2: Grid2x2,
  text: MessageCircle,
};
/** Questions without a right answer show responses live; questions with one are scored and ranked. */
const kindGroups: { title: string; hint: string; kinds: Kind[] }[] = [
  {
    title: "Without an answer",
    hint: "Gather opinions. Responses show live by default.",
    kinds: [
      "slide",
      "cloud",
      "poll",
      "ranking",
      "slider",
      "qna",
      "points100",
      "grid2x2",
      "text",
    ],
  },
  {
    title: "With an answer",
    hint: "Score players. Responses stay hidden and a top 10 ranking follows.",
    kinds: ["quiz", "truefalse"],
  },
];
/** Question types a player can write themselves (everything that collects a response). */
const crowdGroups = kindGroups.map((group) => ({
  ...group,
  kinds: group.kinds.filter((kind) => kind !== "slide"),
}));
const kindHints: Record<Kind, string> = {
  slide: "Just a title and description, no input needed",
  cloud: "One word, a whole room of perspectives",
  poll: "Let everyone pick their favorite",
  quiz: "A correct answer and a little competition",
  truefalse: "A binary choice: true or false",
  ranking: "Drag to sort items from most to least important",
  slider: "Estimate a numeric value on a sliding scale",
  qna: "Participants submit and upvote live questions",
  points100: "Allocate 100 points across a set of options to show priorities",
  grid2x2: "Rate items across a two-axis graph",
  text: "Give every thought a little room",
};
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

/** Reactions audiences can send. The heart stays in the middle of the picker. */
const reactionOptions = [
  { kind: "clap", label: "Clap", emoji: "👏", color: "#e0a53a" },
  { kind: "smile", label: "Smile", emoji: "😊", color: "#e8b421" },
  { kind: "heart", label: "Heart", emoji: "", color: "#e0607e" },
  { kind: "star", label: "Star", emoji: "⭐", color: "#e8a317" },
  { kind: "tada", label: "Celebrate", emoji: "🎉", color: "#8a63d2" },
] as const;

/** The audience's row of reaction buttons, shown in the lobby and during questions. */
function ReactionBar({
  tap,
  disabled,
  onSend,
}: {
  tap: { kind: string; count: number };
  disabled: boolean;
  onSend: (kind: string) => void;
}) {
  return (
    <div className="reaction-bar" role="group" aria-label="Send a reaction">
      {reactionOptions.map((option) => (
        <button
          type="button"
          key={option.kind}
          className={`heart-button reaction-${option.kind}`}
          aria-label={
            option.kind === "heart" ? "Send a heart" : `Send ${option.label}`
          }
          onClick={() => onSend(option.kind)}
          disabled={disabled}
          style={{ ["--reaction-color" as string]: option.color }}
        >
          <span
            key={tap.kind === option.kind ? tap.count : 0}
            className={tap.kind === option.kind ? "heart-tapped" : ""}
          >
            {option.kind === "heart" ? (
              <Heart size={24} fill="currentColor" />
            ) : (
              <span className="reaction-emoji">{option.emoji}</span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

type FloatingHeart = {
  id: number;
  kind: string;
  left: number;
  drift: number;
  size: number;
  duration: number;
};

/** Hearts sent by participants pop up, float toward the top, and slowly fade away. */
function HeartLayer() {
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const nextId = useRef(0);
  useEffect(
    () =>
      onHeart((payload) => {
        const id = nextId.current++;
        setHearts((current) => [
          ...current.slice(-39),
          {
            id,
            kind: payload?.kind ?? "heart",
            left: 6 + Math.random() * 88,
            drift: Math.round(Math.random() * 90 - 45),
            size: 24 + Math.round(Math.random() * 22),
            duration: 3.6 + Math.random() * 1.6,
          },
        ]);
      }),
    [],
  );
  return (
    <div className="heart-layer" aria-hidden="true">
      {hearts.map((heart) => (
        <span
          key={heart.id}
          className="floating-heart"
          style={{
            left: `${heart.left}%`,
            animationDuration: `${heart.duration}s`,
            ["--heart-drift" as string]: `${heart.drift}px`,
          }}
          onAnimationEnd={() =>
            setHearts((current) =>
              current.filter((item) => item.id !== heart.id),
            )
          }
        >
          {heart.kind === "heart" ? (
            <Heart size={heart.size} fill="currentColor" strokeWidth={1.5} />
          ) : (
            <span
              className="floating-emoji"
              style={{ fontSize: `${heart.size}px` }}
            >
              {reactionOptions.find((item) => item.kind === heart.kind)?.emoji}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

function ResultsVisual({
  question,
  preview = false,
  reveal = false,
  fit = false,
  onUpvote,
  upvotedIds,
}: {
  question: Question;
  preview?: boolean;
  reveal?: boolean;
  fit?: boolean;
  onUpvote?: (entrantId: string) => void;
  upvotedIds?: Set<string>;
}) {
  if (question.type === "slide") return null;
  const results: { text: string; count: number; id?: string }[] = preview
    ? question.type === "cloud"
      ? samples
      : question.type === "text"
        ? [
            { text: "More time to explore ideas together.", count: 1 },
            { text: "The energy we bring as a team!", count: 1 },
          ]
        : question.type === "slider"
          ? [
              { text: "Average: 6.4", count: 5 },
              { text: String(question.sliderMin ?? 0), count: 1 },
              { text: "4", count: 2 },
              { text: "7", count: 1 },
              { text: String(question.sliderMax ?? 10), count: 1 },
            ]
          : question.type === "qna"
            ? [
                { id: "1", text: "What’s next for the roadmap?", count: 6 },
                { id: "2", text: "Can we see this in action?", count: 3 },
              ]
            : question.type === "grid2x2"
              ? [
                  { text: "Average: 24,18", count: 5 },
                  { text: "40,30", count: 1 },
                  { text: "10,20", count: 1 },
                  { text: "-20,10", count: 1 },
                  { text: "30,-5", count: 1 },
                  { text: "60,35", count: 1 },
                ]
              : question.options.map((text, index) => ({
                  text,
                  count: [8, 14, 6, 10, 4, 5][index],
                }))
    : question.results || [];
  const total =
    question.type === "qna"
      ? results.length
      : results.reduce((sum, item) => sum + item.count, 0);
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
            : question.type === "qna"
              ? "Submitted questions will appear here as they arrive."
              : "Responses will appear here as they arrive."}
        </p>
      </div>
    );
  if (question.type === "cloud")
    return <WordCloud results={results} />;
  if (question.type === "points100") {
    const allocated = [...results].sort((first, second) => second.count - first.count);
    const peak = Math.max(1, ...allocated.map((item) => item.count));
    return (
      <div className="ranking-results">
        {allocated.map((item, index) => (
          <div className="ranking-row" key={item.text}>
            <div className="poll-label">
              <span>
                <b className={`option-letter color-${index % 4}`}>
                  {String.fromCharCode(65 + index)}
                </b>
                {item.text}
              </span>
              <strong>{item.count} pts</strong>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill ranking-fill"
                style={{ width: `${(item.count / peak) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (question.type === "ranking") {
    const ranked = [...results].sort((first, second) => second.count - first.count);
    return (
      <div className="ranking-results">
        {ranked.map((item, index) => (
          <div className="ranking-row" key={item.text}>
            <div className="poll-label">
              <span>
                <span className="ranking-position">{index + 1}</span>
                {item.text}
              </span>
              <strong>{item.count} pts</strong>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill ranking-fill"
                style={{
                  width: `${ranked[0].count ? (item.count / ranked[0].count) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (question.type === "slider") {
    const [summary, ...distribution] = results;
    const peak = Math.max(1, ...distribution.map((item) => item.count));
    return (
      <div className="slider-results">
        <div className="slider-average">
          <SlidersHorizontal size={20} />
          <strong>{summary?.text || "Average: 0"}</strong>
        </div>
        <div className="slider-histogram">
          {distribution.map((item) => (
            <div className="slider-bar" key={item.text}>
              <div
                className="slider-bar-fill"
                style={{ height: `${(item.count / peak) * 100}%` }}
              />
              <small>{item.text}</small>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (question.type === "grid2x2") {
    const [summary, ...points] = results;
    const toPercent = (value: number) => ((value + 100) / 200) * 100;
    const parsePoint = (text: string) => {
      const [x, y] = text.split(",").map(Number);
      return { x: x || 0, y: y || 0 };
    };
    const average = summary ? parsePoint(summary.text.replace("Average: ", "")) : { x: 0, y: 0 };
    return (
      <div className="grid2x2-results">
        <div className="grid2x2-plot">
          <span className="grid2x2-axis-label grid2x2-top">
            {question.options[3]}
          </span>
          <span className="grid2x2-axis-label grid2x2-bottom">
            {question.options[2]}
          </span>
          <span className="grid2x2-axis-label grid2x2-left">
            {question.options[0]}
          </span>
          <span className="grid2x2-axis-label grid2x2-right">
            {question.options[1]}
          </span>
          <span className="grid2x2-quadrant-h" />
          <span className="grid2x2-quadrant-v" />
          {points.map((point, index) => {
            const { x, y } = parsePoint(point.text);
            return (
              <span
                key={index}
                className="grid2x2-dot"
                style={{
                  left: `${toPercent(x)}%`,
                  top: `${toPercent(-y)}%`,
                }}
              />
            );
          })}
          {points.length > 0 && (
            <span
              className="grid2x2-dot grid2x2-dot-average"
              style={{
                left: `${toPercent(average.x)}%`,
                top: `${toPercent(-average.y)}%`,
              }}
            />
          )}
        </div>
        <div className="grid2x2-summary">
          <Grid2x2 size={18} />
          <strong>{summary?.text || "Average: 0,0"}</strong>
          <span>{points.length} responses placed</span>
        </div>
      </div>
    );
  }
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
  if (question.type === "qna")
    return (
      <div className="qna-results">
        {[...results]
          .sort((first, second) => second.count - first.count)
          .map((item, index) => (
            <div className="qna-entry" key={item.id ?? index}>
              <MessageCircleQuestion size={18} />
              <p>{item.text}</p>
              {onUpvote && item.id ? (
                <button
                  type="button"
                  className={`qna-upvote ${upvotedIds?.has(item.id) ? "chosen" : ""}`}
                  onClick={() => onUpvote(item.id!)}
                  aria-pressed={upvotedIds?.has(item.id)}
                >
                  <ArrowUp size={14} />
                  {item.count}
                </button>
              ) : (
                <span className="qna-upvote-count">
                  <ArrowUp size={14} />
                  {item.count}
                </span>
              )}
            </div>
          ))}
      </div>
    );
  return (
    <PollResults
      question={question}
      results={results}
      total={total}
      reveal={reveal}
      fit={fit}
    />
  );
}

/**
 * Poll/quiz bars. With `fit`, every option shares one font size: as large as
 * the space allows for short options, smaller only when the text is long.
 */
function PollResults({
  question,
  results,
  total,
  reveal,
  fit,
}: {
  question: Question;
  results: { text: string; count: number }[];
  total: number;
  reveal: boolean;
  fit: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  useFitFont(
    box,
    list,
    11,
    38,
    results.map((item) => item.text).join("\n") + (reveal ? "r" : "") + fit,
  );
  const content = (
    <div
      ref={list}
      className={`poll-results ${results.length >= 4 ? "two-col" : ""}`}
    >
      {results.map((item, index) => {
        const isAnswer =
          reveal &&
          ["quiz", "truefalse"].includes(question.type) &&
          question.correct === index;
        const hasAnswer =
          reveal && ["quiz", "truefalse"].includes(question.type);
        return (
        <div
          className={`poll-row ${isAnswer ? "is-answer" : hasAnswer ? "not-answer" : ""}`}
          key={index}
        >
          <div className="poll-label">
            <span>
              <b className={`option-letter color-${index % 4}`}>
                {String.fromCharCode(65 + index)}
              </b>
              {item.text}
              {isAnswer && (
                <em className="answer-badge">
                  <Check size={18} strokeWidth={3} />
                  Correct
                </em>
              )}
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
        );
      })}
    </div>
  );
  return fit ? (
    <div className="poll-fit" ref={box}>
      {content}
    </div>
  ) : (
    content
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
  showQr = false,
}: {
  question: Question;
  preview?: boolean;
  theme?: string;
  code?: string;
  index?: number;
  total?: number;
  reveal?: boolean;
  showQr?: boolean;
}) {
  const Icon = icons[question.type];
  return (
    <section
      className={`question-stage theme-${theme} ${code && showQr ? "has-qr" : ""}`}
    >
      {code && showQr && <JoinQr code={code} />}
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
          {question.author ? (
            <>
              A QUESTION FROM{" "}
              <strong className="author-name">
                {question.author.toLocaleUpperCase()}
              </strong>
            </>
          ) : question.type === "slide" ? (
            "A MOMENT TOGETHER"
          ) : (
            "A LITTLE CHECK-IN, A BIG CONNECTION"
          )}
        </span>
        <h2>{question.title}</h2>
        {question.type === "cloud" && <p>One word. All the feels.</p>}
        {question.type === "slide" && (
          <p className="stage-slide-description">{question.description}</p>
        )}
      </div>
      {!preview &&
      code &&
      hasRevealMode(question.type) &&
      question.revealMode !== "live" &&
      !reveal ? (
        <div className="response-hidden">
          <strong>{question.responses || 0}</strong>
          <h3>
            {question.responses === 1 ? "person has" : "people have"} responded
          </h3>
          <p>Results stay hidden until the host clicks Reveal results.</p>
        </div>
      ) : (
        <ResultsVisual
          question={question}
          preview={preview}
          reveal={reveal}
          fit
        />
      )}
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

/**
 * Grows the font size of `list` to the largest value (between min and max, in px)
 * whose content still fits inside `box`, and keeps it fitted on resize.
 */
function useFitFont(
  box: RefObject<HTMLElement | null>,
  list: RefObject<HTMLElement | null>,
  min: number,
  max: number,
  key: string,
) {
  useLayoutEffect(() => {
    const container = box.current;
    const content = list.current;
    if (!container || !content) return;
    const fit = () => {
      let low = min;
      let high = max;
      while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        content.style.fontSize = `${middle}px`;
        if (
          content.offsetHeight <= container.clientHeight &&
          content.scrollWidth <= container.clientWidth
        )
          low = middle;
        else high = middle - 1;
      }
      content.style.fontSize = `${low}px`;
    };
    fit();
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) fit();
    });
    const observer = new ResizeObserver(fit);
    observer.observe(container);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [box, list, min, max, key]);
}

/** A stable pseudo-random number between -1 and 1 for a name, so the layout looks scattered but never jumps. */
function jitter(name: string) {
  let hash = 0;
  for (const character of name) hash = (hash * 31 + character.charCodeAt(0)) | 0;
  return ((Math.abs(hash) % 2001) - 1000) / 1000;
}

/** Joined participants, as large as the space allows and smaller as more people arrive. */
function LobbyNames({ names, max }: { names: string[]; max: number }) {
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  useFitFont(box, list, 12, max, names.join("\n"));
  return (
    <div className="lobby-people" aria-label="Joined participants" ref={box}>
      {names.length ? (
        <ul ref={list}>
          {names.map((name, index) => (
            <li
              key={index}
              className={`color-${index % 4}`}
              style={{ ["--jitter" as string]: jitter(name + index) }}
            >
              {name}
            </li>
          ))}
        </ul>
      ) : (
        <div className="lobby-empty">
          <Users size={32} strokeWidth={1.3} />
          <p>Waiting for everyone to arrive</p>
        </div>
      )}
    </div>
  );
}

function WelcomeLobby({ room, theme = "mint", host = false, onStart, disabled, startLabel = "Start questions" }: { room: Room; theme?: string; host?: boolean; onStart?: () => void; disabled?: boolean; startLabel?: string }) {
  return <section className={`welcome-lobby theme-${theme} ${host ? "host-lobby" : ""}`} aria-label="Welcome lobby">
    <div className="lobby-intro"><div><span className="eyebrow">{host ? "WELCOME TO THE SESSION" : room.title}</span><h1>{host ? room.title : "Welcome, everyone."}</h1><span className="lobby-waiting"><span className="live-indicator" />{host ? "The room is open" : "You're in"}</span></div>{host && <button className="button primary" disabled={disabled} onClick={onStart}><Play size={17} />{startLabel}</button>}</div>
    <div className="lobby-body">
      {host ? <div className="lobby-join"><h2>Join the session</h2><ShareDetails code={room.code} inline /></div> : <div className="lobby-code"><span>ROOM CODE</span><strong>{room.code.slice(0, 3)} {room.code.slice(3)}</strong></div>}
      <div className="lobby-roster">
        <div className="lobby-count" role="status" aria-label="Total participants joined"><Users size={22} /><strong>{room.participants}</strong><span>{room.participants === 1 ? "participant joined" : "participants joined"}</span></div>
        <LobbyNames names={room.participantNames} max={host ? 120 : 56} />
      </div>
    </div>
    <div className="lobby-footer"><span className="stage-brand"><Zap size={16} fill="currentColor" />pulse.</span><span>{host ? "Everyone in? Let's begin." : room.crowd ? `Soon you'll write a ${labels[room.crowd.kind]} question.` : "Waiting for your host to start."}</span></div>
  </section>;
}

/** Host view while players write their questions. */
function CrowdWriting({ room, theme, disabled, onStart }: { room: Room; theme: string; disabled: boolean; onStart: () => void }) {
  const crowd = room.crowd!;
  const total = Math.max(room.participants, 1);
  return <section className={`welcome-lobby host-lobby crowd-writing theme-${theme}`} aria-label="Players are writing questions">
    <div className="lobby-intro">
      <div>
        <span className="eyebrow">PLAYER-MADE QUESTIONS · {labels[crowd.kind].toLocaleUpperCase()}</span>
        <h1>Players are writing their questions</h1>
        <span className="lobby-waiting"><span className="live-indicator" />Each player adds one {labels[crowd.kind]} question</span>
      </div>
      <button className="button primary" disabled={disabled || crowd.submitted === 0} onClick={onStart}><Play size={17} />Start game</button>
    </div>
    <div className="lobby-body">
      <div className="lobby-roster">
        <div className="lobby-count" role="status" aria-label="Questions submitted"><Users size={22} /><strong>{crowd.submitted}</strong><span>of {room.participants} {room.participants === 1 ? "question" : "questions"} in</span></div>
        <div className="crowd-progress" aria-hidden="true"><span style={{ width: `${Math.min(100, (crowd.submitted / total) * 100)}%` }} /></div>
        {crowd.waiting.length ? <div className="crowd-waiting"><h2>Still writing</h2><ul>{crowd.waiting.map((name, index) => <li key={index} className={`color-${index % 4}`}>{name}</li>)}</ul></div> : <div className="crowd-waiting"><h2>Everyone is ready</h2></div>}
      </div>
    </div>
    <div className="lobby-footer"><span className="stage-brand"><Zap size={16} fill="currentColor" />pulse.</span><span>You can start as soon as at least one question is in. Questions are played in random order.</span></div>
  </section>;
}

type Authored = {
  title: string;
  options: string[];
  correct: number | null;
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
};

function blankAuthored(kind: Kind): Authored {
  return {
    title: "",
    options:
      kind === "truefalse"
        ? ["True", "False"]
        : kind === "grid2x2"
          ? ["", "", "", ""]
          : ["poll", "quiz", "ranking", "points100"].includes(kind)
            ? ["", ""]
            : [],
    correct: kind === "quiz" || kind === "truefalse" ? 0 : null,
    ...(kind === "slider" ? { sliderMin: 0, sliderMax: 10, sliderStep: 1 } : {}),
  };
}

/** The form every player fills in to write their own question of the host's chosen type. */
function AuthorQuestion({ kind, sent, busy, disabled, onSubmit }: { kind: Kind; sent: boolean; busy: boolean; disabled: boolean; onSubmit: (question: Authored) => void }) {
  const [draft, setDraft] = useState<Authored>(() => blankAuthored(kind));
  const isOptions = ["poll", "quiz", "ranking", "points100"].includes(kind);
  const isTrueFalse = kind === "truefalse";
  const isGrid = kind === "grid2x2";
  const isSlider = kind === "slider";
  const hasCorrect = kind === "quiz" || isTrueFalse;
  const sliderOk =
    !isSlider ||
    (typeof draft.sliderMin === "number" &&
      typeof draft.sliderMax === "number" &&
      typeof draft.sliderStep === "number" &&
      draft.sliderStep > 0 &&
      draft.sliderMax > draft.sliderMin &&
      (draft.sliderMax - draft.sliderMin) / draft.sliderStep <= 1000);
  const valid =
    !!draft.title.trim() &&
    sliderOk &&
    (!(isOptions || isGrid) || draft.options.every((option) => option.trim())) &&
    (!isOptions || (draft.options.length >= 2 && draft.options.length <= 6));
  const setOption = (index: number, text: string) =>
    setDraft({ ...draft, options: draft.options.map((value, position) => (position === index ? text : value)) });
  const axisNames = ["X axis · left (low)", "X axis · right (high)", "Y axis · bottom (low)", "Y axis · top (high)"];
  return (
    <form
      className="answer-form author-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ ...draft, title: draft.title.trim(), options: draft.options.map((option) => option.trim()) });
      }}
    >
      <div>
        <span className="eyebrow">YOUR TURN · {labels[kind].toLocaleUpperCase()}</span>
        <h1>Write a question for everyone</h1>
        <p className="author-note">Everyone writes one. All questions are played in random order and show who asked them.</p>
      </div>
      {sent && <div className="qna-submitted-note"><CheckCheck size={20} />Your question is in. You can still edit it until the host starts the game.</div>}
      <label>
        {isSlider ? "What should people estimate?" : isTrueFalse ? "Your true-or-false statement" : "Your question"}
        <textarea required rows={3} maxLength={200} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Type your question..." />
        <small className="character-count">{draft.title.length} / 200</small>
      </label>
      {isTrueFalse && (
        <fieldset className="author-options">
          <legend>Which is correct?</legend>
          {draft.options.map((option, index) => (
            <label className="author-choice" key={index}>
              <input type="radio" name="author-correct" checked={draft.correct === index} onChange={() => setDraft({ ...draft, correct: index })} />
              {option}
            </label>
          ))}
        </fieldset>
      )}
      {isOptions && (
        <fieldset className="author-options">
          <legend>{kind === "ranking" ? "Items to rank" : kind === "points100" ? "Options to allocate points across" : "Answer options"}{hasCorrect && <span> · Select the correct answer</span>}</legend>
          {draft.options.map((option, index) => (
            <div className="option-editor" key={index}>
              {hasCorrect ? (
                <input aria-label={`Option ${index + 1} is correct`} type="radio" name="author-correct" checked={draft.correct === index} onChange={() => setDraft({ ...draft, correct: index })} />
              ) : (
                <span className={`option-letter color-${index % 4}`}>{String.fromCharCode(65 + index)}</span>
              )}
              <input aria-label={`Option ${index + 1}`} required maxLength={100} value={option} onChange={(event) => setOption(index, event.target.value)} />
              <IconButton
                icon={X}
                label={`Remove option ${index + 1}`}
                disabled={draft.options.length <= 2}
                onClick={() =>
                  setDraft({
                    ...draft,
                    options: draft.options.filter((_, position) => position !== index),
                    correct: hasCorrect ? (draft.correct === index ? 0 : draft.correct! > index ? draft.correct! - 1 : draft.correct) : null,
                  })
                }
              />
            </div>
          ))}
          {draft.options.length < 6 && (
            <button type="button" className="text-button" onClick={() => setDraft({ ...draft, options: [...draft.options, ""] })}>
              <Plus size={16} />
              Add option
            </button>
          )}
        </fieldset>
      )}
      {isGrid && (
        <fieldset className="author-options">
          <legend>Axis labels</legend>
          {axisNames.map((name, index) => (
            <label key={index}>
              {name}
              <input required maxLength={40} value={draft.options[index] ?? ""} onChange={(event) => setOption(index, event.target.value)} />
            </label>
          ))}
        </fieldset>
      )}
      {isSlider && (
        <fieldset className="slider-range-editor">
          <legend>Slider range</legend>
          <label>
            Minimum
            <input type="number" required value={draft.sliderMin ?? 0} onChange={(event) => setDraft({ ...draft, sliderMin: Number(event.target.value) })} />
          </label>
          <label>
            Maximum
            <input type="number" required value={draft.sliderMax ?? 10} onChange={(event) => setDraft({ ...draft, sliderMax: Number(event.target.value) })} />
          </label>
          <label>
            Step
            <input type="number" required min={0.01} step="any" value={draft.sliderStep ?? 1} onChange={(event) => setDraft({ ...draft, sliderStep: Number(event.target.value) })} />
          </label>
          {!sliderOk && <small className="field-error">Maximum must be greater than minimum, step must be positive, and the range can have at most 1,000 steps.</small>}
        </fieldset>
      )}
      <button className="button primary full" disabled={busy || disabled || !valid}>
        {busy ? <LoaderCircle className="spin" size={18} /> : <><Send size={17} />{sent ? "Update my question" : "Submit my question"}</>}
      </button>
    </form>
  );
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
  const isTrueFalse = draft.type === "truefalse";
  const isRanking = draft.type === "ranking";
  const isPoints100 = draft.type === "points100";
  const isGrid2x2 = draft.type === "grid2x2";
  const isSlider = draft.type === "slider";
  const isOptions =
    draft.type === "poll" ||
    draft.type === "quiz" ||
    isTrueFalse ||
    isRanking ||
    isPoints100;
  const hasCorrectAnswer = draft.type === "quiz" || isTrueFalse;
  const isSlide = draft.type === "slide";
  const sliderRangeValid =
    !isSlider ||
    (typeof draft.sliderMin === "number" &&
      typeof draft.sliderMax === "number" &&
      typeof draft.sliderStep === "number" &&
      draft.sliderStep > 0 &&
      draft.sliderMax > draft.sliderMin &&
      (draft.sliderMax - draft.sliderMin) / draft.sliderStep <= 1000);
  function setAxisLabel(index: number, text: string) {
    setDraft({
      ...draft,
      options: draft.options.map((value, position) =>
        position === index ? text : value,
      ),
    });
  }
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
            {kindGroups.map((group) => (
              <optgroup key={group.title} label={group.title}>
                {group.kinds.map((kind) => (
                  <option key={kind} value={kind}>
                    {labels[kind]}
                  </option>
                ))}
              </optgroup>
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
        {isSlider && (
          <fieldset className="slider-range-editor">
            <legend>Slider range</legend>
            <label>
              Minimum
              <input
                type="number"
                required
                value={draft.sliderMin ?? 0}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    sliderMin: Number(event.target.value),
                  })
                }
              />
            </label>
            <label>
              Maximum
              <input
                type="number"
                required
                value={draft.sliderMax ?? 10}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    sliderMax: Number(event.target.value),
                  })
                }
              />
            </label>
            <label>
              Step
              <input
                type="number"
                required
                min={0.01}
                value={draft.sliderStep ?? 1}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    sliderStep: Number(event.target.value),
                  })
                }
              />
            </label>
            {!sliderRangeValid && (
              <small className="field-error">
                Maximum must be greater than minimum, step must be positive,
                and the range can have at most 1,000 steps.
              </small>
            )}
          </fieldset>
        )}
        {canCompete(draft.type) && (
          <label className="competitive-toggle">
            <input
              type="checkbox"
              checked={draft.competitive !== false}
              onChange={(event) =>
                setDraft({ ...draft, competitive: event.target.checked })
              }
            />
            <span>
              <b>Faster answers score more</b>
              <small>
                500 points for the right answer plus up to 500 for answering
                fast (less time, more points). Untick for a flat 1,000 points.
                The final podium shows the top 3 players.
              </small>
            </span>
          </label>
        )}
        {canCompete(draft.type) && (
          <label className="competitive-toggle">
            <input
              type="checkbox"
              checked={draft.showRanking !== false}
              onChange={(event) =>
                setDraft({ ...draft, showRanking: event.target.checked })
              }
            />
            <span>
              <b>Show the top 10 ranking</b>
              <small>
                After the results, show the ranking of the top 10 players before
                the next question.
              </small>
            </span>
          </label>
        )}
        {hasRevealMode(draft.type) && (
          <fieldset className="reveal-mode-editor">
            <legend>When should responses show?</legend>
            <label>
              <input
                type="radio"
                name="reveal-mode"
                checked={draft.revealMode !== "live"}
                onChange={() => setDraft({ ...draft, revealMode: "onDone" })}
              />
              <span>
                <b>Hide until done</b>
                <small>
                  Show only how many people responded, then reveal the answers
                  when you click Reveal results.
                </small>
              </span>
            </label>
            <label>
              <input
                type="radio"
                name="reveal-mode"
                checked={draft.revealMode === "live"}
                onChange={() => setDraft({ ...draft, revealMode: "live" })}
              />
              <span>
                <b>Show on the fly</b>
                <small>Responses appear live as people answer.</small>
              </span>
            </label>
          </fieldset>
        )}
        {isGrid2x2 && (
          <fieldset className="grid2x2-axis-editor">
            <legend>Axis labels</legend>
            <label>
              X axis · left (low)
              <input
                required
                maxLength={40}
                value={draft.options[0] ?? ""}
                onChange={(event) => setAxisLabel(0, event.target.value)}
              />
            </label>
            <label>
              X axis · right (high)
              <input
                required
                maxLength={40}
                value={draft.options[1] ?? ""}
                onChange={(event) => setAxisLabel(1, event.target.value)}
              />
            </label>
            <label>
              Y axis · bottom (low)
              <input
                required
                maxLength={40}
                value={draft.options[2] ?? ""}
                onChange={(event) => setAxisLabel(2, event.target.value)}
              />
            </label>
            <label>
              Y axis · top (high)
              <input
                required
                maxLength={40}
                value={draft.options[3] ?? ""}
                onChange={(event) => setAxisLabel(3, event.target.value)}
              />
            </label>
          </fieldset>
        )}
        {isOptions && (
          <fieldset>
            <legend>
              {isRanking
                ? "Items to rank"
                : isPoints100
                  ? "Options to allocate points across"
                  : "Answer options"}{" "}
              {hasCorrectAnswer && <span>· Select the correct answer</span>}
            </legend>
            {draft.options.map((option, index) => (
              <div className="option-editor" key={index}>
                {hasCorrectAnswer ? (
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
                {!isTrueFalse && (
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
                          hasCorrectAnswer
                            ? draft.correct === index
                              ? 0
                              : draft.correct! > index
                                ? draft.correct! - 1
                                : draft.correct
                            : null,
                      })
                    }
                  />
                )}
              </div>
            ))}
            {!isTrueFalse && draft.options.length < 6 && (
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
              (isGrid2x2 && draft.options.some((option) => !option.trim())) ||
              (isSlide && !draft.description?.trim()) ||
              (isSlider && !sliderRangeValid)
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

/** The participant join link; on localhost it uses the LAN address so phones can reach it. */
function useJoinUrl(code: string) {
  const [origin, setOrigin] = useState(window.location.origin);
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
  return `${origin}/join?code=${code}`;
}

/** Small join QR pinned to the top right of a live slide. */
function JoinQr({ code }: { code: string }) {
  const url = useJoinUrl(code);
  return (
    <div className="join-qr" title={`Join at ${code.slice(0, 3)} ${code.slice(3)}`}>
      <QRCodeSVG value={url} size={96} marginSize={1} title="Join session QR code" fgColor="#183d35" level="M" />
      <span>Scan to join</span>
      <strong>
        {code.slice(0, 3)} {code.slice(3)}
      </strong>
    </div>
  );
}

function ShareDetails({ code, inline = false }: { code: string; inline?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const linkInput = useRef<HTMLInputElement>(null);
  const url = useJoinUrl(code);
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
          <Podium room={room} />
          {room.questions
            .filter((question) => question.type !== "slide")
            .map((question, index) => (
              <section className="result-section" key={question.id}>
                <span className="eyebrow">
                  {String(index + 1).padStart(2, "0")} /{" "}
                  {labels[question.type]}
                  {question.author ? ` · by ${question.author}` : ""}
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

const confettiColors = ["#f2c14e", "#e0607e", "#6fb58a", "#6aa6d9", "#9b7fd1", "#f29d5c"];

type ConfettiPiece = {
  left: number;
  delay: number;
  duration: number;
  color: string;
  width: number;
  spin: number;
  sway: number;
};

/** A full-screen burst of falling confetti that starts after `delay` ms and removes itself after a few seconds. */
function Confetti({ delay = 0 }: { delay?: number }) {
  const [pieces] = useState<ConfettiPiece[]>(() =>
    Array.from({ length: 90 }, (_, index) => ({
      left: Math.random() * 100,
      delay: Math.random() * 1.6,
      duration: 3.2 + Math.random() * 2.4,
      color: confettiColors[index % confettiColors.length],
      width: 6 + Math.round(Math.random() * 7),
      spin: Math.round(Math.random() * 720 + 360),
      sway: Math.round(Math.random() * 160 - 80),
    })),
  );
  const [ready, setReady] = useState(delay === 0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const start = setTimeout(() => setReady(true), delay);
    const stop = setTimeout(() => setDone(true), delay + 7500);
    return () => {
      clearTimeout(start);
      clearTimeout(stop);
    };
  }, [delay]);
  if (done || !ready) return null;
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((piece, index) => (
        <i
          key={index}
          style={{
            left: `${piece.left}%`,
            width: piece.width,
            height: piece.width * 1.6,
            background: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            ["--confetti-spin" as string]: `${piece.spin}deg`,
            ["--confetti-sway" as string]: `${piece.sway}px`,
          }}
        />
      ))}
    </div>
  );
}

const medals = ["gold", "silver", "bronze"] as const;

/** Kahoot-style podium for the top three players of a competitive session, with confetti. */
function Podium({ room }: { room: Room }) {
  const winners = room.leaderboard.slice(0, 3).filter((entry) => entry.score > 0);
  if (!(room.ended || room.podium) || !room.scored || !winners.length) return null;
  // Visual order on the podium: silver, gold, bronze.
  const order = [1, 0, 2].filter((index) => winners[index]);
  return (
    <section className="podium-section" aria-label="Final podium">
      {/* 3rd, 2nd and 1st place rise one after another; confetti follows the winner. */}
      <Confetti delay={3500} />
      <Trophy size={32} className="podium-trophy" />
      <h2>And the winners are…</h2>
      <div className="podium">
        {order.map((index) => (
          <div className={`podium-place place-${index + 1}`} key={index}>
            <span className={`medal medal-${medals[index]}`} aria-label={`${medals[index]} medal`}>
              {index + 1}
            </span>
            <strong className="podium-name">{winners[index].name}</strong>
            <span className="podium-score">
              {winners[index].score.toLocaleString()} pts
            </span>
            <div className="podium-block" />
          </div>
        ))}
      </div>
    </section>
  );
}

/** The host's full-slide ranking of the top 10 players, or the final podium. */
function ScoreStage({ room, theme, showQr = false }: { room: Room; theme: string; showQr?: boolean }) {
  return (
    <section
      className={`question-stage score-stage theme-${theme} ${showQr ? "has-qr" : ""}`}
    >
      {showQr && <JoinQr code={room.code} />}
      {room.podium ? (
        room.leaderboard.some((entry) => entry.score > 0) ? (
          <Podium room={room} />
        ) : (
          <p className="score-empty">No points were scored.</p>
        )
      ) : (
        <Leaderboard room={room} compact title="Top 10 players" />
      )}
    </section>
  );
}

function Leaderboard({
  room,
  compact = false,
  title = "The leaderboard",
  maxFont = 64,
}: {
  room: Room;
  compact?: boolean;
  title?: string;
  maxFont?: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  useFitFont(
    box,
    list,
    11,
    maxFont,
    JSON.stringify(room.leaderboard) + (compact ? "c" : "") + maxFont,
  );
  if (compact)
    return (
      <section className="leaderboard compact">
        <Trophy size={28} />
        <h2>{title}</h2>
        <div className="leader-fit" ref={box}>
          <div className="leader-list" ref={list}>
            {room.leaderboard.map((entry, index) => (
              <div className="leader-row" key={index}>
                <b>{index + 1}</b>
                <span>{entry.name}</span>
                <strong>{entry.score.toLocaleString()} pts</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  return (
    <section className="leaderboard">
      <Trophy size={32} />
      <h2>{title}</h2>
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
    "add" | "share" | "new" | "help" | "end" | "delete" | "import" | "simulate" | "crowd" | null
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
  // A player-made room has no questions until the game starts; fall back to the draft.
  const question =
    (room && !room.ended ? room.questions[room.active] : undefined) ??
    session.questions[Math.max(0, currentIndex)] ??
    session.questions[0];
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
  async function startCrowdSession(crowdKind: Kind) {
    setBusy(true);
    setError("");
    try {
      const created: Session = {
        ...newSession("blank"),
        title: "Player-made questions",
      };
      const reply = await request("room:create", {
        title: created.title,
        questions: created.questions,
        crowdKind,
      });
      const credentials = { code: reply.state!.code, token: reply.token! };
      live.saveCredentials({ ...credentials, sessionId: created.id });
      setSessions((items) => [
        ...items,
        { ...created, hostedRooms: [credentials] },
      ]);
      setSessionId(created.id);
      live.setRoom(reply.state!);
      setSelected(0);
      setPage("studio");
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
                            ) : item.type === "truefalse" ? (
                              <ToggleLeft size={32} strokeWidth={1.5} />
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
                {isLive && <HeartLayer />}
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
                      icon={QrCode}
                      className={session.showQr !== false ? "toggle-on" : ""}
                      label={
                        session.showQr !== false
                          ? "Hide join QR code on slides"
                          : "Show join QR code on slides"
                      }
                      onClick={() =>
                        updateSession({ showQr: session.showQr === false })
                      }
                    />
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
                {inLobby && room.crowd?.authoring ? <CrowdWriting room={room} theme={session.theme} disabled={busy || !connected} onStart={() => void control("start")} /> : inLobby ? <WelcomeLobby room={room} theme={session.theme} host disabled={busy || !connected || (!!room.crowd && room.participants === 0)} startLabel={room.crowd ? "Ask players to write questions" : "Start questions"} onStart={() => void control(room.crowd ? "collect" : "start")} /> : isLive && (room.ranking || room.podium) ? <ScoreStage room={room} theme={session.theme} showQr={session.showQr !== false} /> : <QuestionStage
                  question={question}
                  preview={!isLive}
                  theme={session.theme}
                  code={isLive ? room.code : undefined}
                  index={currentIndex}
                  total={questionList.length}
                  reveal={room?.revealed}
                  showQr={session.showQr !== false}
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
                    {question.type !== "slide" && question.type !== "qna" && (
                      <button
                        className="button secondary"
                        onClick={() => void control("reveal")}
                        disabled={room.revealed || busy}
                      >
                        <Eye size={17} />
                        {room.revealed ? "Results revealed" : "Reveal results"}
                      </button>
                    )}
                    {(() => {
                      const last = currentIndex === questionList.length - 1;
                      // Each click advances one step: show results, then the top 10
                      // ranking (answered questions, not the last one), then the next
                      // question. After the last question a session with answered
                      // questions ends on the podium before it is finished.
                      // Questions already showing results on the fly skip the first step,
                      // except answered ones, whose correct answer still needs a reveal.
                      const showFirst =
                        hasRevealMode(question.type) &&
                        (question.revealMode !== "live" ||
                          canCompete(question.type)) &&
                        !room.revealed;
                      const showRanking =
                        !showFirst &&
                        !last &&
                        canCompete(question.type) &&
                        question.showRanking !== false &&
                        !room.ranking;
                      const showPodium = !showFirst && last && room.scored && !room.podium;
                      return (
                        <button
                          className="button primary"
                          onClick={() =>
                            showFirst
                              ? void control("reveal")
                              : showRanking
                                ? void control("ranking")
                                : showPodium
                                  ? void control("podium")
                                  : last
                                    ? setModal("end")
                                    : move(1)
                          }
                          disabled={busy}
                        >
                          {showFirst ? (
                            <>
                              <Eye size={17} />
                              Show results
                            </>
                          ) : showRanking ? (
                            <>
                              <Trophy size={17} />
                              Show ranking
                            </>
                          ) : showPodium ? (
                            <>
                              <Trophy size={17} />
                              Show podium
                            </>
                          ) : (
                            <>
                              {last ? "Finish session" : "Next question"}
                              <ArrowRight size={17} />
                            </>
                          )}
                        </button>
                      );
                    })()}
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
                                : question.type === "truefalse"
                                  ? "A quick binary call: true or false."
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
          {kindGroups.map((group) => (
          <section className="question-group" key={group.title}>
            <h3>{group.title}</h3>
            <p>{group.hint}</p>
          <div className="question-types">
            {group.kinds.map((kind) => {
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
                            : kind === "truefalse"
                              ? "A binary choice: true or false"
                              : kind === "ranking"
                                ? "Drag to sort items from most to least important"
                                : kind === "slider"
                                  ? "Estimate a numeric value on a sliding scale"
                                  : kind === "qna"
                                    ? "Participants submit and upvote live questions"
                                    : kind === "points100"
                                      ? "Allocate 100 points across a set of options to show priorities"
                                      : kind === "grid2x2"
                                        ? "Rate items across a two-axis graph"
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
          </section>
          ))}
        </Modal>
      )}
      {modal === "crowd" && (
        <Modal
          title="What should players write?"
          onClose={() => setModal(null)}
        >
          <p className="muted crowd-intro">
            Players join, then each writes one question of the type you pick. The
            questions are played in random order, each one showing who wrote it.
          </p>
          {crowdGroups.map((group) => (
            <section className="question-group" key={group.title}>
              <h3>{group.title}</h3>
              <div className="question-types">
                {group.kinds.map((kind) => {
                  const Icon = icons[kind];
                  return (
                    <button
                      key={kind}
                      disabled={busy}
                      onClick={() => {
                        setModal(null);
                        void startCrowdSession(kind);
                      }}
                    >
                      <span className={`type-icon type-${kind}`}>
                        <Icon size={25} />
                      </span>
                      <span>
                        <strong>{labels[kind]}</strong>
                        <small>{kindHints[kind]}</small>
                      </span>
                      <ArrowRight size={19} />
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
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
          <button
            className="button secondary full"
            disabled={!connected || busy}
            onClick={() => setModal("crowd")}
          >
            <Shuffle size={17} />
            Players write the questions
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
              Pause responses, reveal results, and advance questions. Correct
              answers earn up to 1,000 points, and faster answers earn more. Export responses from Results.
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
  const [answer, setAnswer] = useState<
    string | number | number[] | { x: number; y: number }
  >("");
  const [answerQuestion, setAnswerQuestion] = useState("");
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());
  const [upvotedQuestion, setUpvotedQuestion] = useState("");
  const [reactionTap, setReactionTap] = useState({ kind: "", count: 0 });
  const live = useLive("audience", initialCode);
  const { room, connected, error, setError, submitted } = live;
  const question = room?.questions[room.active];
  const currentUpvoted = upvotedQuestion === question?.id ? upvoted : new Set<string>();
  const currentAnswer = answerQuestion === question?.id ? answer : "";
  const rankingOrder =
    question?.type === "ranking"
      ? Array.isArray(currentAnswer)
        ? currentAnswer
        : question.options.map((_, index) => index)
      : [];
  const sliderValue =
    question?.type === "slider"
      ? typeof currentAnswer === "number"
        ? currentAnswer
        : Math.round(
            ((question.sliderMin ?? 0) + (question.sliderMax ?? 10)) / 2,
          )
      : 0;
  const pointsAllocation =
    question?.type === "points100"
      ? Array.isArray(currentAnswer) &&
        currentAnswer.length === question.options.length
        ? currentAnswer
        : question.options.map(() => 0)
      : [];
  const pointsAllocated = pointsAllocation.reduce(
    (sum, points) => sum + points,
    0,
  );
  const gridPoint =
    question?.type === "grid2x2"
      ? currentAnswer &&
        typeof currentAnswer === "object" &&
        !Array.isArray(currentAnswer)
        ? currentAnswer
        : null
      : null;
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
        value:
          question.type === "ranking"
            ? rankingOrder
            : question.type === "slider"
              ? sliderValue
              : question.type === "points100"
                ? pointsAllocation
                : question.type === "grid2x2"
                  ? gridPoint
                  : currentAnswer,
      });
      live.setSubmitted((items) => [...items, question.id]);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function moveRankItem(from: number, to: number) {
    if (!question) return;
    const next = [...rankingOrder];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setAnswer(next);
    setAnswerQuestion(question.id);
  }
  function setPointsFor(index: number, points: number) {
    if (!question) return;
    // The other options keep their points, so this one can only use what is left of 100.
    const remaining = 100 - (pointsAllocated - (pointsAllocation[index] ?? 0));
    const capped = Math.max(0, Math.min(remaining, Math.round(points) || 0));
    const next = pointsAllocation.map((value, position) =>
      position === index ? capped : value,
    );
    setAnswer(next);
    setAnswerQuestion(question.id);
  }
  function setGridPoint(x: number, y: number) {
    if (!question) return;
    setAnswer({
      x: Math.max(-100, Math.min(100, Math.round(x))),
      y: Math.max(-100, Math.min(100, Math.round(y))),
    });
    setAnswerQuestion(question.id);
  }
  async function sendAuthored(authored: Authored) {
    setBusy(true);
    setError("");
    try {
      await request("room:author", {
        ...live.credentials(),
        question: authored,
      });
      live.setSubmitted((items) =>
        items.includes("crowd-authored") ? items : [...items, "crowd-authored"],
      );
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function sendHeart(kind = "heart") {
    setReactionTap((current) => ({ kind, count: current.count + 1 }));
    try {
      await request("room:react", { ...(live.credentials() ?? {}), kind });
    } catch {
      // A dropped heart is harmless; the next tap tries again.
    }
  }
  async function upvote(entrantId: string) {
    if (!question) return;
    const toggle = (current: Set<string>) => {
      const next = new Set(current);
      if (next.has(entrantId)) next.delete(entrantId);
      else next.add(entrantId);
      return next;
    };
    setUpvotedQuestion(question.id);
    setUpvoted(toggle(currentUpvoted));
    try {
      await request("room:upvote", {
        ...live.credentials(),
        questionId: question.id,
        entrantToken: entrantId,
      });
    } catch (failure) {
      setUpvotedQuestion(question.id);
      setUpvoted((current) => toggle(current));
      setError((failure as Error).message);
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
          <Podium room={room} />
          {room.leaderboard.some((entry) => entry.score > 0) && (
            <Leaderboard room={room} />
          )}
          <a className="button primary" href="/join">
            Join another session
            <ArrowRight size={17} />
          </a>
        </main>
      ) : !room.started && room.crowd?.authoring ? (
        <main className="participant-session">
          <div className="participant-room">
            <span>{room.title}</span>
            <span>
              {room.code.slice(0, 3)} {room.code.slice(3)}
            </span>
          </div>
          <AuthorQuestion
            kind={room.crowd.kind}
            sent={submitted.includes("crowd-authored")}
            busy={busy}
            disabled={!connected}
            onSubmit={(authored) => void sendAuthored(authored)}
          />
          <ReactionBar
            tap={reactionTap}
            disabled={!connected}
            onSend={(kind) => void sendHeart(kind)}
          />
        </main>
      ) : !room.started ? (
        <main className="participant-lobby">
          <WelcomeLobby room={room} />
          <ReactionBar
            tap={reactionTap}
            disabled={!connected}
            onSend={(kind) => void sendHeart(kind)}
          />
        </main>
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
            {question.author && (
              <span className="participant-author">
                A question from{" "}
                <strong className="author-name">{question.author}</strong>
              </span>
            )}
            <h1>{question.title}</h1>
            {question.author &&
              question.author === live.credentials()?.name &&
              canCompete(question.type) && (
                <p className="author-note">
                  You wrote this one, so it won’t score for you.
                </p>
              )}
            {room.podium && room.scored ? (
              <div className="participant-reveal">
                <Podium room={room} />
                <p className="waiting-note">
                  Thanks for playing. Your host will wrap up shortly.
                </p>
              </div>
            ) : room.ranking ? (
              <div className="participant-reveal">
                <div className="participant-ranking">
                  <Leaderboard
                    room={room}
                    compact
                    title="Top 10 players"
                    maxFont={16}
                  />
                </div>
                <p className="waiting-note">
                  Your host will continue to the next question shortly.
                </p>
              </div>
            ) : question.type === "slide" ? (
              <div className="participant-slide">
                <FileText size={38} />
                <p>{question.description}</p>
                <p className="waiting-note">
                  Sit back for a moment. Your host will continue shortly.
                </p>
              </div>
            ) : question.type === "qna" ? (
              <div className="qna-session">
                {!hasSubmitted && room.accepting ? (
                  <form
                    onSubmit={vote}
                    className="answer-form qna-submit-form"
                  >
                    <label>
                      Ask your question
                      <textarea
                        rows={3}
                        maxLength={280}
                        required
                        placeholder="What would you like to ask?"
                        value={String(currentAnswer)}
                        onChange={(event) => {
                          setAnswer(event.target.value);
                          setAnswerQuestion(question.id);
                        }}
                      />
                      <small className="character-count">
                        {String(currentAnswer).length} / 280
                      </small>
                    </label>
                    <button
                      className="button primary full"
                      disabled={
                        busy ||
                        !connected ||
                        !(
                          typeof currentAnswer === "string" &&
                          currentAnswer.trim()
                        )
                      }
                    >
                      {busy ? (
                        <LoaderCircle className="spin" size={18} />
                      ) : (
                        <>
                          <Send size={17} />
                          Submit question
                        </>
                      )}
                    </button>
                  </form>
                ) : hasSubmitted ? (
                  <div className="qna-submitted-note">
                    <CheckCheck size={20} />
                    Your question is in. Keep upvoting the ones you like most.
                  </div>
                ) : (
                  <div className="qna-submitted-note">
                    <Pause size={20} />
                    Your host has paused new questions. You can still upvote.
                  </div>
                )}
                <ResultsVisual
                  question={question}
                  onUpvote={(entrantId) => void upvote(entrantId)}
                  upvotedIds={currentUpvoted}
                />
              </div>
            ) : room.revealed ? (
              <div className="participant-reveal">
                <span className="result-tag">
                  <BarChart3 size={15} />
                  The results are in
                </span>
                <ResultsVisual question={question} reveal />
                {["quiz", "truefalse"].includes(question.type) && (
                  <div className="correct-answer">
                    <Check size={20} />
                    Correct answer: {question.options[question.correct!]}
                  </div>
                )}
                <p className="waiting-note">
                  A moment to take it in. Your host will continue shortly.
                </p>
              </div>
            ) : question.revealMode === "live" &&
              (hasSubmitted || !room.accepting) ? (
              <div className="participant-reveal">
                <span className="result-tag">
                  <BarChart3 size={15} />
                  Live results
                </span>
                <ResultsVisual question={question} />
                <p className="waiting-note">
                  {hasSubmitted ? "Your voice is in. " : ""}Results update as
                  people answer.
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
                {["poll", "quiz", "truefalse"].includes(question.type) ? (
                  <div
                    className={`answer-options ${question.options.length >= 4 ? "two-col" : ""}`}
                  >
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
                ) : question.type === "ranking" ? (
                  <div className="rank-list" aria-label="Drag to reorder, most important first">
                    {rankingOrder.map((optionIndex, position) => (
                      <div
                        className="rank-item"
                        key={optionIndex}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", String(position));
                        }}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault();
                          const from = Number(event.dataTransfer.getData("text/plain"));
                          moveRankItem(from, position);
                        }}
                      >
                        <GripVertical size={16} />
                        <span className="rank-position">{position + 1}</span>
                        <span>{question.options[optionIndex]}</span>
                        <div className="rank-move-buttons">
                          <IconButton
                            icon={ArrowUp}
                            label={`Move ${question.options[optionIndex]} up`}
                            disabled={position === 0}
                            onClick={() => moveRankItem(position, position - 1)}
                          />
                          <IconButton
                            icon={ArrowDown}
                            label={`Move ${question.options[optionIndex]} down`}
                            disabled={position === rankingOrder.length - 1}
                            onClick={() => moveRankItem(position, position + 1)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : question.type === "slider" ? (
                  <div className="slider-input">
                    <output>{sliderValue}</output>
                    <input
                      type="range"
                      min={question.sliderMin ?? 0}
                      max={question.sliderMax ?? 10}
                      step={question.sliderStep ?? 1}
                      value={sliderValue}
                      onChange={(event) => {
                        setAnswer(Number(event.target.value));
                        setAnswerQuestion(question.id);
                      }}
                    />
                    <div className="slider-bounds">
                      <span>{question.sliderMin ?? 0}</span>
                      <span>{question.sliderMax ?? 10}</span>
                    </div>
                  </div>
                ) : question.type === "points100" ? (
                  <div className="points100-input">
                    <div
                      className={`points100-total ${pointsAllocated === 100 ? "complete" : ""}`}
                    >
                      <Percent size={16} />
                      <strong>{pointsAllocated}</strong>
                      <span>/ 100 allocated</span>
                    </div>
                    <div className="points100-list">
                      {question.options.map((option, index) => (
                        <div className="points100-row" key={index}>
                          <span className={`option-letter color-${index % 4}`}>
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="points100-label">{option}</span>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={pointsAllocation[index] ?? 0}
                            onChange={(event) =>
                              setPointsFor(index, Number(event.target.value))
                            }
                          />
                          <input
                            type="number"
                            className="points100-value"
                            min={0}
                            max={100 - (pointsAllocated - (pointsAllocation[index] ?? 0))}
                            inputMode="numeric"
                            value={pointsAllocation[index] ?? 0}
                            onChange={(event) =>
                              setPointsFor(
                                index,
                                Math.max(
                                  0,
                                  Math.min(100, Number(event.target.value) || 0),
                                ),
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                    {pointsAllocated !== 100 && (
                      <small className="field-error">
                        Allocate exactly 100 points to submit.
                      </small>
                    )}
                  </div>
                ) : question.type === "grid2x2" ? (
                  <div className="grid2x2-input">
                    <button
                      type="button"
                      className="grid2x2-pad"
                      aria-label="Tap to place your point on the grid"
                      onClick={(event) => {
                        const bounds =
                          event.currentTarget.getBoundingClientRect();
                        const fractionX =
                          (event.clientX - bounds.left) / bounds.width;
                        const fractionY =
                          (event.clientY - bounds.top) / bounds.height;
                        setGridPoint(
                          fractionX * 200 - 100,
                          -(fractionY * 200 - 100),
                        );
                      }}
                    >
                      <span className="grid2x2-axis-label grid2x2-top">
                        {question.options[3]}
                      </span>
                      <span className="grid2x2-axis-label grid2x2-bottom">
                        {question.options[2]}
                      </span>
                      <span className="grid2x2-axis-label grid2x2-left">
                        {question.options[0]}
                      </span>
                      <span className="grid2x2-axis-label grid2x2-right">
                        {question.options[1]}
                      </span>
                      <span className="grid2x2-quadrant-h" />
                      <span className="grid2x2-quadrant-v" />
                      {gridPoint && (
                        <span
                          className="grid2x2-marker"
                          style={{
                            left: `${((gridPoint.x + 100) / 200) * 100}%`,
                            top: `${((-gridPoint.y + 100) / 200) * 100}%`,
                          }}
                        />
                      )}
                    </button>
                    <small className="grid2x2-coords">
                      {gridPoint
                        ? `x: ${gridPoint.x} · y: ${gridPoint.y}`
                        : "Tap the grid to place your point."}
                    </small>
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
                    (question.type === "points100"
                      ? pointsAllocated !== 100
                      : question.type === "grid2x2"
                        ? !gridPoint
                        : !["ranking", "slider"].includes(question.type) &&
                          (currentAnswer === "" ||
                            (typeof currentAnswer === "string" &&
                              !currentAnswer.trim())))
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
            <ReactionBar
              tap={reactionTap}
              disabled={!connected}
              onSend={(kind) => void sendHeart(kind)}
            />
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
