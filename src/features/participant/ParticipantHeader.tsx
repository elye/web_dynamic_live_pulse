import { Logo } from "../../components/Logo";
import { useParticipant } from "./ParticipantContext";
import { ParticipantNameEditor } from "./ParticipantNameEditor";

export function ParticipantHeader() {
  const { connected, participantName } = useParticipant();
  return (
    <header className="participant-header">
      <Logo />
      <div className="participant-header-meta">
        {participantName && <ParticipantNameEditor />}
        <span className={`connection ${connected ? "" : "offline"}`}>
          <span />
          {connected ? "Connected" : "Reconnecting..."}
        </span>
      </div>
    </header>
  );
}
