import { Users } from "lucide-react";
import { ReactionBar } from "../../../components/ReactionBar";
import { inputOf } from "../../../questions/ui/inputRegistry";
import { useParticipant } from "../ParticipantContext";
import { AnswerForm } from "./AnswerForm";
import { LiveResultsReveal } from "./LiveResultsReveal";
import { PausedState } from "./PausedState";
import { PodiumReveal } from "./PodiumReveal";
import { SuspenseReveal } from "./SuspenseReveal";
import { QuestionHeader } from "./QuestionHeader";
import { RankingReveal } from "./RankingReveal";
import { ResultsReveal } from "./ResultsReveal";
import { SubmittedState } from "./SubmittedState";

export function QuestionScreen() {
  const {
    room,
    question,
    isFullySubmitted,
    connected,
    sendHeart,
    reactionTap,
  } = useParticipant();
  if (!room || !question) return null;
  const { Screen } = inputOf(question.type);
  return (
    <main className="participant-session">
      <QuestionHeader />
      {room.podium && room.scored ? (
        <PodiumReveal />
      ) : room.suspense && room.scored ? (
        <SuspenseReveal />
      ) : room.ranking ? (
        <RankingReveal />
      ) : Screen ? (
        <Screen />
      ) : room.revealed ? (
        <ResultsReveal />
      ) : question.revealMode === "live" &&
        !room.hidden &&
        (isFullySubmitted || !room.accepting) ? (
        <LiveResultsReveal />
      ) : isFullySubmitted ? (
        <SubmittedState />
      ) : !room.accepting ? (
        <PausedState />
      ) : (
        <AnswerForm />
      )}
      <ReactionBar
        tap={reactionTap}
        disabled={!connected}
        onSend={(kind) => void sendHeart(kind)}
      />
      <div className="participant-bottom">
        <span>
          <Users size={15} />
          {room.participants} in the room
        </span>
        <span>
          <span className="live-dot" />
          Live together
        </span>
      </div>
    </main>
  );
}
