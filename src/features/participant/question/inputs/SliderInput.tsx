import { useParticipant } from "../../ParticipantContext";

export function SliderInput() {
  const { setAnswer, setAnswerQuestion, question, sliderValue, room } =
    useParticipant();
  if (!room || !question) return null;
  return (
    <div className="slider-input">
      <output>{sliderValue}</output>
      <input
        type="range"
        min={question.sliderMin ?? 0}
        max={question.sliderMax ?? 10}
        step={question.sliderStep ?? 1}
        value={sliderValue}
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
