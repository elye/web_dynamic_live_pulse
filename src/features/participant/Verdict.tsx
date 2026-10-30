import { Check, X } from "lucide-react";
import { type Answer } from "../../live";
import { type Question } from "../../model";
import { scoreShare } from "../../questions";

/** Tells a player how they did on a revealed question that has a correct answer. */
export function Verdict({
  question,
  answer,
  answered,
}: {
  question: Question;
  answer: Answer | undefined;
  answered: boolean;
}) {
  let tone: "right" | "partial" | "wrong" | "missed";
  let title: string;
  let detail = "";
  const corrects = question.corrects;
  if (!answered) {
    tone = "missed";
    title = "No answer this time";
  } else if (corrects?.length) {
    const picked = Array.isArray(answer) ? (answer as number[]) : [];
    const right = picked.filter((index) => corrects.includes(index)).length;
    const wrong = picked.length - right;
    if (wrong === 0 && right === corrects.length) {
      tone = "right";
      title = "You got it right!";
      detail = `You found all ${corrects.length} correct answers.`;
    } else if (wrong === 0 && right > 0) {
      tone = "partial";
      title = "Partly right!";
      detail = `You found ${right} of ${corrects.length} correct answers.`;
    } else {
      tone = "wrong";
      title = "Not quite";
      detail =
        right > 0
          ? `You found ${right} of ${corrects.length}, but picked ${wrong} wrong ${wrong === 1 ? "option" : "options"}, so no points this time.`
          : "None of your picks were correct.";
    }
  } else {
    const share = scoreShare(question, answer);
    if (share >= 1) {
      tone = "right";
      title = "You got it right!";
    } else if (share > 0) {
      tone = "partial";
      title = "Partly right!";
      detail = `You earned ${Math.round(share * 100)}% of the points.`;
    } else {
      tone = "wrong";
      title = "Not quite";
    }
  }
  return (
    <div className={`verdict verdict-${tone}`} role="status">
      {tone === "wrong" || tone === "missed" ? (
        <X size={22} />
      ) : (
        <Check size={22} />
      )}
      <div>
        <strong>{title}</strong>
        {detail && <span>{detail}</span>}
      </div>
    </div>
  );
}
