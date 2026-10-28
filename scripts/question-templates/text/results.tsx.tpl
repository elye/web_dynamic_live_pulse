import { TextResults } from "../../../features/results/TextResults";
import { type QuestionResults } from "../../ui/results";

// TODO(new-question): replace the sample rows and the visual if this is not a text list.
export const results: QuestionResults = {
  Results: ({ results }) => <TextResults results={results} />,
  previewRows: () => [
    { text: "A sample response.", count: 1 },
    { text: "Another sample response.", count: 1 },
  ],
  emptyText: "Responses will appear here as they arrive.",
};
