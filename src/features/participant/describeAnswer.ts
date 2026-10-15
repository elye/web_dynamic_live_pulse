import { type Answer } from "../../live";
import { type Question } from "../../model";

/** Describes what a player sent for a question, e.g. the options they ticked. */
export function describeAnswer(question: Question, answer: Answer | undefined) {
  if (answer === undefined || answer === null || answer === "") return "";
  const label = (index: number) =>
    `${String.fromCharCode(65 + index)}. ${question.options[index] ?? ""}`;
  if (Array.isArray(answer)) {
    if (question.type === "ranking")
      return answer
        .map((index, position) => `${position + 1}. ${question.options[index]}`)
        .join(" · ");
    if (question.type === "points100")
      return answer
        .map((points, index) => ({ points, index }))
        .filter((item) => item.points > 0)
        .map((item) => `${question.options[item.index]}: ${item.points}`)
        .join(" · ");
    return answer.map(label).join(" · ");
  }
  if (typeof answer === "number")
    return question.type === "slider" ? String(answer) : label(answer);
  if (typeof answer === "object") return `x: ${answer.x} · y: ${answer.y}`;
  return answer;
}
