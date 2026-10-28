import { canCompete } from "../../../model";
import type { EditorSectionProps } from "../../../questions/ui/editor";

/** Scoring toggles for every type that has a right answer. */
export function ScoringOptions({ draft, setDraft }: EditorSectionProps) {
  if (!canCompete(draft.type)) return null;
  return (
    <>
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
            500 points for the right answer plus up to 500 for answering fast
            (less time, more points). Untick for a flat 1,000 points. The final
            podium shows the top 3 players.
          </small>
        </span>
      </label>
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
            After the results, show the ranking of the top 10 players before the
            next question.
          </small>
        </span>
      </label>
    </>
  );
}
