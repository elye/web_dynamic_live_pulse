import { canCompete } from "../../../model";
import { useParticipant } from "../ParticipantContext";
import { ChoiceInput } from "./inputs/ChoiceInput";
import { GridInput } from "./inputs/GridInput";
import { PointsInput } from "./inputs/PointsInput";
import { RankingInput } from "./inputs/RankingInput";
import { SliderInput } from "./inputs/SliderInput";
import { SubmitButton } from "./inputs/SubmitButton";
import { TextInput } from "./inputs/TextInput";

export function AnswerForm() {
  const { room, question, vote } = useParticipant();
  if (!room || !question) return null;
  return (
    <form onSubmit={vote} className="answer-form">
      {question.type === "poll" || canCompete(question.type) ? (
        <ChoiceInput />
      ) : question.type === "ranking" ? (
        <RankingInput />
      ) : question.type === "slider" ? (
        <SliderInput />
      ) : question.type === "points100" ? (
        <PointsInput />
      ) : question.type === "grid2x2" ? (
        <GridInput />
      ) : (
        <TextInput />
      )}
      <SubmitButton />
    </form>
  );
}
