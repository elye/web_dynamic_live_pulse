import {
  hasNoBlankOptions,
  type EditorSection,
  type QuestionEditor,
} from "../../ui/editor";
import { optionsSection } from "../../../features/editor/sections/OptionsEditor";

const QuizSettings: EditorSection = ({ draft, setDraft }) => (
  <label className="competitive-toggle">
    <input
      type="checkbox"
      checked={draft.multiple === true}
      onChange={(event) => {
        if (event.target.checked) {
          setDraft({
            ...draft,
            multiple: true,
            corrects: [draft.correct ?? 0],
          });
        } else {
          const { corrects, ...rest } = draft;
          setDraft({
            ...rest,
            multiple: false,
            correct: corrects?.length ? Math.min(...corrects) : 0,
          });
        }
      }}
    />
    <span>
      <b>Allow multiple answers</b>
      <small>
        Tick every correct option. Players can select several and earn points in
        proportion to the correct options they found (2 of 3 is 67% of the
        points). Picking any wrong option scores 0.
      </small>
    </span>
  </label>
);

export const editor: QuestionEditor = {
  settings: [QuizSettings],
  fields: [optionsSection({ legend: "Answer options", multipleCorrect: true })],
  isValid: (draft) =>
    hasNoBlankOptions(draft) &&
    !(draft.multiple === true && !(draft.corrects ?? []).length),
};
