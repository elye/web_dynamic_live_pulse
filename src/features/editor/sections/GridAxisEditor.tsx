import type { EditorSectionProps } from "../../../questions/ui/editor";

export const axes = [
  "X axis · left (low)",
  "X axis · right (high)",
  "Y axis · bottom (low)",
  "Y axis · top (high)",
];

export function GridAxisEditor({ draft, setDraft }: EditorSectionProps) {
  function setAxisLabel(index: number, text: string) {
    setDraft({
      ...draft,
      options: draft.options.map((value, position) =>
        position === index ? text : value,
      ),
    });
  }
  return (
    <fieldset className="grid2x2-axis-editor">
      <legend>Axis labels</legend>
      {axes.map((axis, index) => (
        <label key={axis}>
          {axis}
          <input
            required
            maxLength={40}
            value={draft.options[index] ?? ""}
            onChange={(event) => setAxisLabel(index, event.target.value)}
          />
        </label>
      ))}
    </fieldset>
  );
}
