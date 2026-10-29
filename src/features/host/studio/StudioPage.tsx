import { HeartLayer } from "../../../components/HeartLayer";
import { useHost } from "../HostContext";
import { CanvasFooter } from "./CanvasFooter";
import { CanvasStage } from "./CanvasStage";
import { CanvasToolbar } from "./CanvasToolbar";
import { FullscreenBar } from "./FullscreenBar";
import { LiveControls } from "./LiveControls";
import { QuestionDetails } from "./QuestionDetails";
import { QuestionRail } from "./QuestionRail";
import { SlideFit } from "./SlideFit";
import { StudioBottom } from "./StudioBottom";
import { StudioHeading } from "./StudioHeading";

export function StudioPage() {
  const { presenting, fullscreen, room } = useHost();
  const isLive = !!room && !room.ended;
  const inLobby = isLive && !room.started;
  if (presenting && fullscreen.fullscreen)
    return (
      <main className="studio slide-only">
        {isLive && <HeartLayer />}
        <SlideFit>
          <CanvasStage />
        </SlideFit>
        <FullscreenBar />
      </main>
    );
  return (
    <main className={`studio ${presenting ? "presenting" : ""}`}>
      <StudioHeading />
      <div className="editor-layout">
        {!presenting && <QuestionRail />}
        <div className="canvas-column">
          {isLive && <HeartLayer />}
          <CanvasToolbar />
          <CanvasStage />
          <CanvasFooter />
          {inLobby ? null : isLive ? <LiveControls /> : <QuestionDetails />}
          {!presenting && <StudioBottom />}
        </div>
      </div>
    </main>
  );
}
