import { useParticipant } from "../../../features/participant/ParticipantContext";
import { type AnswerValue, type QuestionInput } from "../../ui/input";
import { type Question } from "../../registry";

const sliderValue = (question: Question, touched: AnswerValue) =>
  typeof touched === "number"
    ? touched
    : Math.round(((question.sliderMin ?? 0) + (question.sliderMax ?? 10)) / 2);

function SliderInput() {
  const { setAnswer, setAnswerQuestion, question, currentAnswer, room } =
    useParticipant();
  if (!room || !question) return null;
  const value = sliderValue(question, currentAnswer);
  return (
    <div className="slider-input">
      <output>{value}</output>
      <input
        type="range"
        min={question.sliderMin ?? 0}
        max={question.sliderMax ?? 10}
        step={question.sliderStep ?? 1}
        value={value}
        onChange={(event) => {
          setAnswer(Number(event.target.value));
          setAnswerQuestion(question.id);
        }}
      />
      <div className="slider-bounds">
        <span>{question.sliderMin ?? 0}</span>
        <span>{question.sliderMax ?? 10}</span>
      </div>
    </div>
  );
}

export const input: QuestionInput = {
  resolve: sliderValue,
  isReady: () => true,
  Input: SliderInput,
};
