import { Logo } from "../../components/Logo";
import { useParticipant } from "./ParticipantContext";

export function ParticipantHeader() {
  const { connected } = useParticipant();
  return (
    <header className="participant-header">
      <Logo />
      <span className={`connection ${connected ? "" : "offline"}`}>
        <span />
        {connected ? "Connected" : "Reconnecting..."}
      </span>
    </header>
  );
}
