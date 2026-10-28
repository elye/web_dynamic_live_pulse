import { LoaderCircle } from "lucide-react";
import { AuthoringPage } from "./AuthoringPage";
import { ErrorBanner } from "./ErrorBanner";
import { FinishPage } from "./FinishPage";
import { JoinPage } from "./JoinPage";
import { LobbyPage } from "./LobbyPage";
import { ParticipantContext } from "./ParticipantContext";
import { ParticipantHeader } from "./ParticipantHeader";
import { QuestionScreen } from "./question/QuestionScreen";
import { useParticipantController } from "./useParticipantController";

export function Participant() {
  const controller = useParticipantController();
  const { room, question, restoring } = controller;
  return (
    <ParticipantContext.Provider value={controller}>
      <div className="participant-shell">
        <ParticipantHeader />
        <ErrorBanner />
        {!room && restoring ? (
          <main className="join-page" aria-busy="true">
            <LoaderCircle className="spin" size={32} aria-label="Joining room" />
          </main>
        ) : !room ? (
          <JoinPage />
        ) : room.ended ? (
          <FinishPage />
        ) : !room.started && room.crowd?.authoring ? (
          <AuthoringPage />
        ) : !room.started ? (
          <LobbyPage />
        ) : (
          question && <QuestionScreen />
        )}
        <footer className="participant-footer">
          A little more human. A little more pulse.
        </footer>
      </div>
    </ParticipantContext.Provider>
  );
}
