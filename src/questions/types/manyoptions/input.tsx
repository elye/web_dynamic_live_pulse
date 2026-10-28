import { Check, Search, X } from "lucide-react";
import { useState } from "react";
import { useParticipant } from "../../../features/participant/ParticipantContext";
import { manyOptionLabels } from "./helpers";
import { choiceBehaviour, pickedOptions } from "../../ui/choiceInput";
import { type QuestionInput } from "../../ui/input";

function ManyOptionsInput() {
  const { setAnswer, setAnswerQuestion, question, currentAnswer, room } =
    useParticipant();
  const [filter, setFilter] = useState("");
  if (!room || !question) return null;
  const isMultiple = question.multiple === true;
  const selectedOptions = pickedOptions(currentAnswer);
  const labels = manyOptionLabels(question);
  const othersIndex = question.others ? labels.length - 1 : -1;
  const selected = isMultiple
    ? [...selectedOptions].sort((a, b) => a - b)
    : typeof currentAnswer === "number"
      ? [currentAnswer]
      : [];
  const keyword = filter.trim().toLocaleLowerCase();
  const visible = labels
    .map((text, index) => ({ text, index }))
    .filter(
      (item) =>
        item.index === othersIndex ||
        !keyword ||
        item.text.toLocaleLowerCase().includes(keyword),
    );

  function choose(index: number) {
    if (!question) return;
    setAnswer(
      isMultiple
        ? selected.includes(index)
          ? selected.filter((item) => item !== index)
          : [...selected, index]
        : index,
    );
    setAnswerQuestion(question.id);
  }

  return (
    <div className="many-input">
      {isMultiple && (
        <small className="multi-hint">Select all that apply</small>
      )}
      {selected.length > 0 && (
        <ul className="many-selected" aria-label="Your selection">
          {selected.map((index) => (
            <li key={index}>
              <button
                type="button"
                onClick={() => choose(index)}
                aria-label={`Remove ${labels[index]}`}
              >
                <span>{labels[index]}</span>
                {isMultiple ? <X size={14} /> : <Check size={14} />}
              </button>
            </li>
          ))}
        </ul>
      )}
      <label className="many-filter">
        <Search size={18} />
        <input
          type="search"
          value={filter}
          placeholder="Search options"
          aria-label="Search options"
          onChange={(event) => setFilter(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
        />
      </label>
      <div className="many-options">
        {visible.map((item) => {
          const chosen = selected.includes(item.index);
          return (
            <button
              type="button"
              key={item.index}
              className={`answer-option ${chosen ? "chosen" : ""} ${item.index === othersIndex ? "others" : ""}`}
              onClick={() => choose(item.index)}
              aria-pressed={chosen}
            >
              <span>{item.text}</span>
              {chosen && <Check size={18} />}
            </button>
          );
        })}
        {!visible.some((item) => item.index !== othersIndex) && (
          <p className="many-empty">No options match “{filter.trim()}”.</p>
        )}
      </div>
    </div>
  );
}

export const input: QuestionInput = {
  ...choiceBehaviour,
  Input: ManyOptionsInput,
};
