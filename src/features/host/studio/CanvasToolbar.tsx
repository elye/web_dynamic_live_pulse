import {
  Expand,
  Maximize,
  Minimize,
  FlaskConical,
  Monitor,
  Moon,
  Pencil,
  QrCode,
  Sun,
  Users,
} from "lucide-react";
import { IconButton } from "../../../components/IconButton";
import { metaOf } from "../../../questions/ui/metaRegistry";
import { useHost } from "../HostContext";
import { MusicVolume } from "./MusicVolume";

export function CanvasToolbar() {
  const {
    setModal,
    setEditing,
    presenting,
    setPresenting,
    fullscreen,
    presentFullscreen,
    session,
    question,
    updateSession,
    room,
  } = useHost();
  const isLive = !!room && !room.ended;
  const simulator = metaOf(question.type).simulator;
  return (
    <div className="canvas-toolbar">
      <div className="view-tabs">
        <span className="selected">
          <Monitor size={16} />
          {isLive ? "Live view" : "Slide preview"}
        </span>
      </div>
      <div className="canvas-tools">
        {isLive && <MusicVolume />}
        {!isLive && simulator && (
          <IconButton
            icon={FlaskConical}
            label={simulator.label}
            onClick={() => setModal("simulate")}
          />
        )}
        {!isLive && (
          <button className="text-button" onClick={() => setEditing(question)}>
            <Pencil size={14} />
            Edit question
          </button>
        )}
        {!isLive && (
          <button
            type="button"
            className={`session-mode-button ${session.nameless ? "active" : ""}`}
            aria-pressed={session.nameless === true}
            title={
              session.nameless
                ? "Participants receive generated names"
                : "Participants will be asked for their names"
            }
            onClick={() =>
              updateSession({ nameless: session.nameless !== true })
            }
          >
            <Users size={14} />
            {session.nameless ? "Nameless session" : "Ask for names"}
          </button>
        )}
        <IconButton
          icon={QrCode}
          className={session.showQr !== false ? "toggle-on" : ""}
          label={
            session.showQr !== false
              ? "Hide join QR code on slides"
              : "Show join QR code on slides"
          }
          onClick={() => updateSession({ showQr: session.showQr === false })}
        />
        <IconButton
          icon={session.dark ? Sun : Moon}
          className={session.dark ? "toggle-on" : ""}
          label={
            session.dark
              ? "Switch slides to light mode"
              : "Switch slides to dark mode"
          }
          onClick={() => updateSession({ dark: !session.dark })}
        />
        <IconButton
          icon={Expand}
          label={presenting ? "Exit presentation view" : "Expand preview"}
          onClick={() => setPresenting(!presenting)}
        />
        {fullscreen.supported && (
          <IconButton
            className="fullscreen-toggle"
            icon={fullscreen.fullscreen ? Minimize : Maximize}
            label={
              fullscreen.fullscreen ? "Exit full screen" : "Present full screen"
            }
            onClick={presentFullscreen}
          />
        )}
      </div>
    </div>
  );
}
