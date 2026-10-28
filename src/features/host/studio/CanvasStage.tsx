import { CrowdWriting } from "../../crowd/CrowdWriting";
import { WelcomeLobby } from "../../lobby/WelcomeLobby";
import { ScoreStage } from "../../scoring/ScoreStage";
import { QuestionStage } from "../../stage/QuestionStage";
import { metaOf } from "../../../questions/ui/metaRegistry";
import { useHost } from "../HostContext";

export function CanvasStage() {
  const {
    modal,
    setModal,
    busy,
    room,
    connected,
    session,
    currentIndex,
    question,
    questionList,
    control,
  } = useHost();
  const isLive = !!room && !room.ended;
  const inLobby = isLive && !room.started;
  const simulator = metaOf(question.type).simulator;
  return (
    <>
      {modal === "simulate" && simulator && (
        <simulator.Simulator
          question={question}
          theme={session.theme}
          onClose={() => setModal(null)}
        />
      )}
      {inLobby && room.crowd?.authoring ? (
        <CrowdWriting
          room={room}
          theme={session.theme}
          disabled={busy || !connected}
          onStart={() => void control("start")}
        />
      ) : inLobby ? (
        <WelcomeLobby
          room={room}
          theme={session.theme}
          host
          disabled={
            busy || !connected || (!!room.crowd && room.participants === 0)
          }
          startLabel={
            room.crowd ? "Ask players to write questions" : "Start questions"
          }
          onStart={() => void control(room.crowd ? "collect" : "start")}
        />
      ) : isLive && (room.ranking || room.suspense || room.podium) ? (
        <ScoreStage
          room={room}
          theme={session.theme}
          showQr={session.showQr !== false}
          onReveal={() => void control("podium")}
          disabled={busy || !connected}
        />
      ) : (
        <QuestionStage
          question={question}
          preview={!isLive}
          theme={session.theme}
          code={isLive ? room.code : undefined}
          nameless={isLive ? room.nameless : false}
          index={currentIndex}
          total={questionList.length}
          reveal={room?.revealed}
          hidden={isLive && room?.hidden}
          totalPlayers={isLive ? room.participants : 0}
          showQr={session.showQr !== false}
        />
      )}
    </>
  );
}
