import { hasRevealMode } from "../../../model";
import type { EditorSectionProps } from "../editorTypes";

export function RevealModeEditor({ draft, setDraft }: EditorSectionProps) {
  if (!hasRevealMode(draft.type)) return null;
  return (
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
            Show only how many people responded, then reveal the answers when
            you click Reveal results.
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
  );
}
