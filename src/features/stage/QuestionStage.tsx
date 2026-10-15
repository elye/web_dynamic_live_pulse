import { Eye, FileText, Users, Zap } from "lucide-react";
import { JoinQr } from "../../components/JoinQr";
import { frameKinds, icons, optionKinds } from "../../constants/kinds";
import { hasRevealMode, labels, type Question } from "../../model";
import { PollResults } from "../results/PollResults";
import { ResultsVisual } from "../results/ResultsVisual";

export function QuestionStage({
  question,
  preview = false,
  theme = "mint",
  code,
  index = 0,
  total = 4,
  reveal = false,
  hidden = false,
  showQr = false,
}: {
  question: Question;
  preview?: boolean;
  theme?: string;
  code?: string;
  index?: number;
  total?: number;
  reveal?: boolean;
  /** The host hid this on-the-fly question's responses. */
  hidden?: boolean;
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
      (question.revealMode !== "live" || hidden) &&
      !reveal ? (
        optionKinds.includes(question.type) ? (
          <>
            <PollResults
              question={question}
              results={question.options.map((text) => ({ text, count: 0 }))}
              total={0}
              reveal={false}
              fit
              hideCounts
            />
            <p className="response-hidden-note">
              <strong>{question.responses || 0}</strong>{" "}
              {question.responses === 1 ? "person has" : "people have"}{" "}
              responded.{" "}
              {hidden
                ? "The host has hidden the responses for now."
                : "Results stay hidden until the host clicks Reveal results."}
            </p>
          </>
        ) : frameKinds.includes(question.type) ? (
          <>
            <ResultsVisual question={question} fit concealed />
            <p className="response-hidden-note">
              <strong>{question.responses || 0}</strong>{" "}
              {question.responses === 1 ? "person has" : "people have"}{" "}
              responded.{" "}
              {hidden
                ? "The host has hidden the responses for now."
                : "Results stay hidden until the host clicks Reveal results."}
            </p>
          </>
        ) : (
          <div className="response-hidden">
            <strong>{question.responses || 0}</strong>
            <h3>
              {question.responses === 1 ? "person has" : "people have"}{" "}
              responded
            </h3>
            <p>
              {hidden
                ? "The host has hidden the responses for now."
                : "Results stay hidden until the host clicks Reveal results."}
            </p>
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
