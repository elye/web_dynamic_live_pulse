import { Expand, FlaskConical, Monitor, Pencil, QrCode } from "lucide-react";
import { IconButton } from "../../../components/IconButton";
import { useHost } from "../HostContext";

export function CanvasToolbar() {
  const {
    setModal,
    setEditing,
    presenting,
    setPresenting,
    session,
    question,
    updateSession,
    room,
  } = useHost();
  const isLive = !!room && !room.ended;
  return (
    <div className="canvas-toolbar">
      <div className="view-tabs">
        <span className="selected">
          <Monitor size={16} />
          {isLive ? "Live view" : "Slide preview"}
        </span>
      </div>
      <div className="canvas-tools">
        {!isLive && question.type === "cloud" && (
          <IconButton
            icon={FlaskConical}
            label="Simulate word cloud"
            onClick={() => setModal("simulate")}
          />
        )}
        {!isLive && (
          <button className="text-button" onClick={() => setEditing(question)}>
            <Pencil size={14} />
            Edit question
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
          icon={Expand}
          label={presenting ? "Exit presentation view" : "Expand preview"}
          onClick={() => setPresenting(!presenting)}
        />
      </div>
    </div>
  );
}
