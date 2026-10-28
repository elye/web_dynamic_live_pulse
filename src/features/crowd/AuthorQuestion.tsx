import { CheckCheck, LoaderCircle, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { labels, readStored, store, type Kind } from "../../model";
import { definitionOf } from "../../questions";
import { authorOf } from "../../questions/ui/authorRegistry";
import { blankAuthored, type Authored } from "./authoring";

/** The form every player fills in to write their own question of the host's chosen type. */
export function AuthorQuestion({
  kind,
  sent,
  busy,
  disabled,
  initial,
  draftKey,
  onSubmit,
}: {
  kind: Kind;
  sent: boolean;
  busy: boolean;
  disabled: boolean;
  initial?: Authored;
  draftKey: string;
  onSubmit: (question: Authored) => void;
}) {
  // Unsent edits survive a refresh; otherwise the question already submitted is shown again.
  const [draft, setDraft] = useState<Authored>(() => {
    const saved = readStored<{ kind?: Kind; draft?: Authored } | null>(
      draftKey,
      null,
    );
    if (saved?.kind === kind && saved.draft) return saved.draft;
    return initial
      ? { ...blankAuthored(kind), ...initial }
      : blankAuthored(kind);
  });
  const firstDraft = useRef(draft);
  useEffect(() => {
    if (draft !== firstDraft.current) store(draftKey, { kind, draft });
  }, [draft, draftKey, kind]);
  const author = authorOf(kind);
  const { Fields } = author;
  const fixedTitle = definitionOf(kind).fixedTitle;
  const valid =
    (!!fixedTitle || !!draft.title.trim()) && (author.isValid?.(draft) ?? true);
  return (
    <form
      className="answer-form author-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          ...draft,
          title: fixedTitle ?? draft.title.trim(),
          options: draft.options.map((option) => option.trim()),
        });
      }}
    >
      <div>
        <span className="eyebrow">
          YOUR TURN · {labels[kind].toLocaleUpperCase()}
        </span>
        <h1>Write a question for everyone</h1>
        <p className="author-note">
          Everyone writes one. All questions are played in random order and show
          who asked them.
        </p>
      </div>
      {sent && (
        <div className="qna-submitted-note">
          <CheckCheck size={20} />
          Your question is in. You can still edit it until the host starts the
          game.
        </div>
      )}
      {fixedTitle ? (
        <p className="fixed-question">{fixedTitle}</p>
      ) : (
        <label>
          {author.titleLabel}
          <textarea
            required
            rows={3}
            maxLength={200}
            value={draft.title}
            onChange={(event) =>
              setDraft({ ...draft, title: event.target.value })
            }
            placeholder="Type your question..."
          />
          <small className="character-count">{draft.title.length} / 200</small>
        </label>
      )}
      {Fields && <Fields draft={draft} setDraft={setDraft} />}
      <button
        className="button primary full"
        disabled={busy || disabled || !valid}
      >
        {busy ? (
          <LoaderCircle className="spin" size={18} />
        ) : (
          <>
            <Send size={17} />
            {sent ? "Update my question" : "Submit my question"}
          </>
        )}
      </button>
    </form>
  );
}
