import { type QuestionResults } from "../../ui/results";
import { shownMatchOptions } from "./definition";
import { MatchDiagram } from "./Diagram";

const sampleShare = [9, 7, 5, 3, 2, 1];
const sampleTotal = 10;

export const results: QuestionResults = {
  // Each item on the left with an arrow to its partner, showing how many players matched it.
  Results: ({ question, results, total, fit, preview }) => {
    // The pairs are only on hand for the host, once revealed, and while editing.
    const pairsKnown = preview || !!question.matchShuffle;
    return (
      <MatchDiagram
        question={question}
        right={question.options.map((_, index) =>
          pairsKnown ? (question.matchOptions?.[index] ?? "") : "?",
        )}
        shares={results.map((row) => ({ count: row.count, total }))}
        fit={fit}
      />
    );
  },
  // While answers are hidden the stage shows both lists, the second as players see it.
  Concealed: ({ question, fit }) => (
    <MatchDiagram
      question={question}
      right={shownMatchOptions(question)}
      fit={fit}
    />
  ),
  previewRows: (question) =>
    question.options.map((text, index) => ({
      text,
      count: sampleShare[index] ?? 0,
    })),
  emptyText: "No matches yet.",
  total: (question, _rows, preview) =>
    preview ? sampleTotal : (question.responses ?? 0),
};
