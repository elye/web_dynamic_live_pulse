import { ManyOptionsResults } from "../../../features/results/ManyOptionsResults";
import { type Question } from "../../registry";
import { type QuestionResults } from "../../ui/results";
import { manyOptionLabels } from "./helpers";

const blankRows = (question: Question) =>
  manyOptionLabels(question).map((text) => ({ text, count: 0 }));

export const results: QuestionResults = {
  Results: ({ question, results, fit }) => (
    <ManyOptionsResults
      results={results}
      voteColors={question.voteColors}
      fit={fit}
    />
  ),
  Concealed: ({ question, fit }) => (
    <ManyOptionsResults results={blankRows(question)} fit={fit} hideCounts />
  ),
  previewRows: (question) =>
    manyOptionLabels(question).map((text, index) => ({
      text,
      count: [3, 0, 7, 1, 0, 4][index % 6],
    })),
  blankRows,
};
