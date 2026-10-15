import { kindGroups } from "../../../constants/kinds";
import { labels, newQuestion, twoTruthsTitle, type Kind } from "../../../model";
import type { EditorSectionProps } from "../editorTypes";

/** Switching type starts a fresh question of that kind but keeps id (and title). */
export function TypeSelect({ draft, setDraft }: EditorSectionProps) {
  return (
    <label>
      Question type
      <select
        value={draft.type}
        onChange={(event) => {
          const type = event.target.value as Kind;
          setDraft({
            ...newQuestion(type),
            id: draft.id,
            title: type === "twotruths" ? twoTruthsTitle : draft.title,
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
  );
}
