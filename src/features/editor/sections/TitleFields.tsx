import { definitionOf } from "../../../questions";
import type { EditorSectionProps } from "../../../questions/ui/editor";

/** The question title, or its fixed wording for types that always ask the same thing. */
export function TitleFields({
  draft,
  setDraft,
  label = "Your question",
}: EditorSectionProps & { label?: string }) {
  const fixedTitle = definitionOf(draft.type).fixedTitle;
  return fixedTitle ? (
    <div className="fixed-question">
      <span>Question</span>
      <p>{fixedTitle}</p>
    </div>
  ) : (
    <label>
      {label}
      <textarea
        autoFocus
        required
        maxLength={200}
        value={draft.title}
        onChange={(event) => setDraft({ ...draft, title: event.target.value })}
        rows={3}
      />
    </label>
  );
}
