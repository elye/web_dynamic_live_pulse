import { Plus, X } from "lucide-react";
import { IconButton } from "../../../components/IconButton";
import { type QuestionEditor } from "../../ui/editor";

const MAX_PAIRS = 6;
const MIN_PAIRS = 2;
const MAX_LENGTH = 100;

const PairsSection: NonNullable<QuestionEditor["fields"]>[number] = ({
  draft,
  setDraft,
}) => {
  const matches = draft.matchOptions ?? draft.options.map(() => "");
  const edit = (items: string[], index: number, value: string) =>
    items.map((item, position) => (position === index ? value : item));

  return (
    <fieldset className="match-pairs">
      <legend>
        Matching pairs <span>· Players see list B jumbled</span>
      </legend>
      {draft.options.map((option, index) => (
        <div className="match-pair" key={index}>
          <span className={`option-letter color-${index % 4}`}>
            {String.fromCharCode(65 + index)}
          </span>
          <input
            aria-label={`Item A ${index + 1}`}
            required
            maxLength={MAX_LENGTH}
            placeholder="Item"
            value={option}
            onChange={(event) =>
              setDraft({
                ...draft,
                options: edit(draft.options, index, event.target.value),
                matchOptions: matches,
              })
            }
          />
          <span className="match-pair-arrow" aria-hidden>
            →
          </span>
          <input
            aria-label={`Item B ${index + 1}`}
            required
            maxLength={MAX_LENGTH}
            placeholder="Its match"
            value={matches[index] ?? ""}
            onChange={(event) =>
              setDraft({
                ...draft,
                matchOptions: edit(matches, index, event.target.value),
              })
            }
          />
          <IconButton
            icon={X}
            label={`Remove pair ${index + 1}`}
            disabled={draft.options.length <= MIN_PAIRS}
            onClick={() =>
              setDraft({
                ...draft,
                options: draft.options.filter(
                  (_, position) => position !== index,
                ),
                matchOptions: matches.filter(
                  (_, position) => position !== index,
                ),
              })
            }
          />
        </div>
      ))}
      {draft.options.length < MAX_PAIRS && (
        <button
          type="button"
          className="text-button"
          onClick={() =>
            setDraft({
              ...draft,
              options: [...draft.options, ""],
              matchOptions: [...matches, ""],
            })
          }
        >
          <Plus size={16} />
          Add pair
        </button>
      )}
    </fieldset>
  );
};

export const editor: QuestionEditor = {
  fields: [PairsSection],
  isValid(draft) {
    const matches = (draft.matchOptions ?? []).map((item) => item.trim());
    return (
      draft.options.length >= MIN_PAIRS &&
      draft.options.length <= MAX_PAIRS &&
      matches.length === draft.options.length &&
      draft.options.every((item) => item.trim()) &&
      matches.every((item) => item && item.length <= MAX_LENGTH) &&
      new Set(matches.map((item) => item.toLowerCase())).size === matches.length
    );
  },
};
