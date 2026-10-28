import WordCloud from "../../../WordCloud";
import { type QuestionResults } from "../../ui/results";

const samples = [
  { text: "excited", count: 12 },
  { text: "curious", count: 9 },
  { text: "inspired", count: 8 },
  { text: "optimistic", count: 7 },
  { text: "energized", count: 6 },
  { text: "ready", count: 5 },
  { text: "focused", count: 4 },
  { text: "grateful", count: 3 },
  { text: "creative", count: 3 },
  { text: "hopeful", count: 2 },
  { text: "connected", count: 2 },
];

export const results: QuestionResults = {
  Results: ({ results }) => <WordCloud results={results} />,
  previewRows: () => samples,
  emptyText: "Your audience’s words will appear here.",
};
