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
  const hasSelectedAlternative =
    typeof currentAnswer === "string" &&
    question.sliderChoices?.includes(currentAnswer);
  return (
    <div className="slider-input">
      <div
        className={`slider-control${hasSelectedAlternative ? " slider-control-muted" : ""}`}
      >
        <output>{value}</output>
        <input
          type="range"
          min={question.sliderMin ?? 0}
          max={question.sliderMax ?? 10}
          step={question.sliderStep ?? 1}
          value={value}
          disabled={hasSelectedAlternative}
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
      {!!question.sliderChoices?.length && (
        <fieldset className="slider-answer-options">
          <legend>Choose your answer</legend>
          <label>
            <input
              type="radio"
              name={`slider-choice-${question.id}`}
              value="slider"
              checked={!hasSelectedAlternative}
              onChange={() => {
                setAnswer(value);
                setAnswerQuestion(question.id);
              }}
            />
            Use slider answer
          </label>
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
