import { canCompete } from "../../../model";
import { isMultiQuiz, type EditorSectionProps } from "../editorTypes";

/** Scoring and multi-answer toggles for poll and quiz style questions. */
export function ScoringOptions({ draft, setDraft }: EditorSectionProps) {
  return (
    <>
      {canCompete(draft.type) && (
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
              (less time, more points). Untick for a flat 1,000 points. The
              final podium shows the top 3 players.
            </small>
          </span>
        </label>
      )}
      {canCompete(draft.type) && (
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
              After the results, show the ranking of the top 10 players before
              the next question.
            </small>
          </span>
        </label>
      )}
      {draft.type === "poll" && (
        <label className="competitive-toggle">
          <input
            type="checkbox"
            checked={draft.multiple === true}
            onChange={(event) =>
              setDraft({ ...draft, multiple: event.target.checked })
            }
          />
          <span>
            <b>Allow multiple answers</b>
            <small>
              Participants can select more than one option. Percentages show how
              many participants picked each option.
            </small>
          </span>
        </label>
      )}
      {draft.type === "quiz" && (
        <label className="competitive-toggle">
          <input
            type="checkbox"
            checked={isMultiQuiz(draft)}
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
              Tick every correct option. Players can select several and earn
              points in proportion to the correct options they found (2 of 3 is
              67% of the points). Picking any wrong option scores 0.
            </small>
          </span>
        </label>
      )}
    </>
  );
}
