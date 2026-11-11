import { useParticipant } from "../../../features/participant/ParticipantContext";
import { type AnswerValue, type QuestionInput } from "../../ui/input";
import { type Question } from "../../registry";

const sliderValue = (question: Question, touched: AnswerValue) =>
  typeof touched === "number"
    ? touched
    : Math.round(((question.sliderMin ?? 0) + (question.sliderMax ?? 10)) / 2);

const sliderAnswer = (question: Question, touched: AnswerValue) =>
  typeof touched === "string" && question.sliderChoices?.includes(touched)
    ? touched
    : sliderValue(question, touched);

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
      {!!question.sliderChoices?.length && (
        <fieldset className="slider-alternatives">
          <legend>Or choose an alternative answer</legend>
          {question.sliderChoices.map((choice) => (
            <label key={choice}>
              <input
                type="radio"
                name={`slider-choice-${question.id}`}
                value={choice}
                checked={currentAnswer === choice}
                onChange={() => {
                  setAnswer(choice);
                  setAnswerQuestion(question.id);
                }}
              />
              {choice}
            </label>
          ))}
        </fieldset>
      )}
    </div>
  );
}

export const input: QuestionInput = {
  resolve: sliderAnswer,
  isReady: () => true,
  Input: SliderInput,
};
