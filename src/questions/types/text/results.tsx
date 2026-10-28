import { TextResults } from "../../../features/results/TextResults";
import { type QuestionResults } from "../../ui/results";

export const results: QuestionResults = {
  Results: ({ results }) => <TextResults results={results} />,
  previewRows: () => [
    { text: "More time to explore ideas together.", count: 1 },
    { text: "The energy we bring as a team!", count: 1 },
  ],
  emptyText: "Responses will appear here as they arrive.",
};
