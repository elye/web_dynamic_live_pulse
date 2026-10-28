import {
  type ConcealedViewProps,
  type QuestionResults,
  type ResultsViewProps,
} from "../../questions/ui/results";
import { type Question } from "../../model";
import { PollResults } from "./PollResults";

const sampleCounts = [8, 14, 6, 10, 4, 5];

export const optionPreviewRows = (question: Question) =>
  question.options.map((text, index) => ({
    text,
    count: sampleCounts[index],
  }));

/** The options with no votes, shown while responses are hidden. */
export function OptionsConcealed({ question, fit }: ConcealedViewProps) {
  return (
    <PollResults
      question={question}
      results={question.options.map((text) => ({ text, count: 0 }))}
      total={0}
      reveal={false}
      fit={fit}
      hideCounts
    />
  );
}

/** Multiple-answer polls and quizzes count people, not picks. */
export const multipleChoiceTotal = (
  question: Question,
  rows: { count: number }[],
  preview: boolean,
) =>
  question.multiple && !preview
    ? (question.responses ?? 0)
    : rows.reduce((sum, item) => sum + item.count, 0);

/** Results as bars (or a chart) over the options. */
export function pollFamilyResults({
  answerLabel = "Correct",
  splitColumns = true,
  chosenDisplay = false,
  total,
}: {
  /** The badge on the right answer after reveal. */
  answerLabel?: string;
  splitColumns?: boolean;
  /** The host picks the chart the results are drawn in. */
  chosenDisplay?: boolean;
  total?: QuestionResults["total"];
} = {}): QuestionResults {
  const Results = ({
    question,
    results,
    total,
    reveal,
    fit,
  }: ResultsViewProps) => (
    <PollResults
      question={question}
      results={results}
      total={total}
      reveal={reveal}
      fit={fit}
      display={chosenDisplay ? question.pollDisplay : undefined}
      answerLabel={answerLabel}
      splitColumns={splitColumns}
    />
  );
  return {
    Results,
    Concealed: OptionsConcealed,
    previewRows: optionPreviewRows,
    total,
  };
}
