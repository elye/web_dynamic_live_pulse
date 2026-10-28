import { Eye, FileText, Users, Zap } from "lucide-react";
import { JoinQr } from "../../components/JoinQr";
import { icons } from "../../constants/kinds";
import { hasRevealMode, labels, type Question } from "../../model";
import { traitsOf } from "../../questions";
import { metaOf } from "../../questions/ui/metaRegistry";
import { ResultsVisual } from "../results/ResultsVisual";

export function QuestionStage({
  question,
  preview = false,
  theme = "mint",
  code,
  nameless = false,
  index = 0,
  total = 4,
  reveal = false,
  hidden = false,
  totalPlayers = 0,
  showQr = false,
}: {
  question: Question;
  preview?: boolean;
  theme?: string;
  code?: string;
  nameless?: boolean;
  index?: number;
  total?: number;
  reveal?: boolean;
  /** The host hid this on-the-fly question's responses. */
  hidden?: boolean;
  /** Number of players who have joined the room, including those who have not responded. */
  totalPlayers?: number;
  showQr?: boolean;
}) {
  const Icon = icons[question.type];
  const { eyebrow, subtitle } = metaOf(question.type);
  const traits = traitsOf(question.type);
  const hiddenNote = hidden
    ? "The host has hidden the responses for now."
    : "Results stay hidden until the host clicks Reveal results.";
  const responseSummary = `${question.responses || 0} of ${totalPlayers} ${totalPlayers === 1 ? "player" : "players"} responded`;
  return (
    <section
      className={`question-stage theme-${theme} ${code && showQr ? "has-qr" : ""}`}
    >
      {code && showQr && <JoinQr code={code} nameless={nameless} />}
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
          ) : (
            (eyebrow ?? "A LITTLE CHECK-IN, A BIG CONNECTION")
          )}
        </span>
        <h2>{question.title}</h2>
        {subtitle?.(question)}
      </div>
      {!preview &&
      code &&
      hasRevealMode(question.type) &&
      (question.revealMode !== "live" || hidden) &&
      !reveal ? (
        traits.optionsVisibleWhenHidden || traits.frameVisibleWhenHidden ? (
          <>
            <ResultsVisual question={question} fit concealed />
            <p className="response-hidden-note">
              <strong>{responseSummary}</strong>. {hiddenNote}
            </p>
          </>
        ) : (
          <div className="response-hidden">
            <strong className="response-summary">{responseSummary}</strong>
            <p>{hiddenNote}</p>
          </div>
        )
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
        {!traits.collectsAnswers ? (
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
