import { TextResults } from "../../../features/results/TextResults";
import { type QuestionResults } from "../../ui/results";

export const results: QuestionResults = {
  Results: ({ results }) => <TextResults results={results} showTarget />,
  previewRows: () => [
    {
      text: "You make everyone feel welcome.",
      target: "Alex",
      count: 1,
    },
    {
      text: "Your creativity inspires the team.",
      target: "Sam",
      count: 1,
    },
  ],
  emptyText: "Responses will appear here as they arrive.",
};
