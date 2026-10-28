import { SliderResults } from "../../../features/results/SliderResults";
import { type QuestionResults } from "../../ui/results";

export const results: QuestionResults = {
  Results: ({ question, results }) => {
    const [summary, ...distribution] = results;
    const average = Number(summary?.text.replace("Average: ", ""));
    return (
      <SliderResults
        min={question.sliderMin ?? 0}
        max={question.sliderMax ?? 10}
        summary={
          summary?.count
            ? summary.text
            : `${question.sliderMin ?? 0} to ${question.sliderMax ?? 10}`
        }
        values={distribution
          .map((item) => ({ value: Number(item.text), count: item.count }))
          .filter((item) => Number.isFinite(item.value))}
        average={summary?.count && Number.isFinite(average) ? average : null}
      />
    );
  },
  Concealed: ({ question }) => (
    <SliderResults
      min={question.sliderMin ?? 0}
      max={question.sliderMax ?? 10}
      summary={`${question.sliderMin ?? 0} to ${question.sliderMax ?? 10}`}
      values={[]}
      average={null}
    />
  ),
  previewRows: (question) => [
    { text: "Average: 6.4", count: 5 },
    { text: String(question.sliderMin ?? 0), count: 1 },
    { text: "4", count: 2 },
    { text: "7", count: 1 },
    { text: String(question.sliderMax ?? 10), count: 1 },
  ],
};
