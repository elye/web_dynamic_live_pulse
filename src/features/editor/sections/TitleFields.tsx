import { twoTruthsTitle } from "../../../model";
import type { EditorSectionProps } from "../editorTypes";

/** Question title (or fixed title for two truths) plus the slide description. */
export function TitleFields({ draft, setDraft }: EditorSectionProps) {
  const isSlide = draft.type === "slide";
  return (
    <>
      {draft.type === "twotruths" ? (
        <div className="fixed-question">
          <span>Question</span>
          <p>{twoTruthsTitle}</p>
        </div>
      ) : (
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
      )}
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
    </>
  );
}
