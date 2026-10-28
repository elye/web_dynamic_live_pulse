import { Radio } from "lucide-react";
import { type Question } from "../../model";
import { traitsOf, type ResultRow } from "../../questions";
import { resultsOf } from "../../questions/ui/resultsRegistry";

export function ResultsVisual({
  question,
  preview = false,
  reveal = false,
  fit = false,
  concealed = false,
  onUpvote,
  upvotedIds,
}: {
  question: Question;
  preview?: boolean;
  reveal?: boolean;
  fit?: boolean;
  /** Responses are hidden: show only what the type keeps on the stage (options, or axes / range). */
  concealed?: boolean;
  onUpvote?: (entrantId: string) => void;
  upvotedIds?: Set<string>;
}) {
  const traits = traitsOf(question.type);
  if (!traits.collectsAnswers) return null;
  const view = resultsOf(question.type);
  if (concealed) {
    if (!view.Concealed) return null;
    if (!traits.optionsVisibleWhenHidden && !traits.frameVisibleWhenHidden)
      return null;
    return (
      <view.Concealed
        question={question}
        results={question.results || []}
        fit={fit}
      />
    );
  }
  const blank = (): ResultRow[] =>
    view.blankRows
      ? view.blankRows(question)
      : question.options.map((text) => ({ text, count: 0 }));
  const results: ResultRow[] = preview
    ? view.previewRows(question)
    : question.results?.length || !traits.optionsVisibleWhenHidden
      ? question.results || []
      : blank();
  const total = view.total
    ? view.total(question, results, preview)
    : results.reduce((sum, item) => sum + item.count, 0);
  if (!preview && !total && view.emptyText)
    return (
      <div className="response-empty">
        <span className="empty-rings">
          <Radio size={34} />
        </span>
        <h3>Waiting for the first spark</h3>
        <p>{view.emptyText}</p>
      </div>
    );
  return (
    <view.Results
      question={question}
      results={results}
      total={total}
      reveal={reveal}
      fit={fit}
      preview={preview}
      onUpvote={onUpvote}
      upvotedIds={upvotedIds}
    />
  );
}
