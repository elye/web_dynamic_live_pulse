import { ReactionBar } from "../../components/ReactionBar";
import { WelcomeLobby } from "../lobby/WelcomeLobby";
import { useParticipant } from "./ParticipantContext";

export function LobbyPage() {
  const { reactionTap, room, connected, sendHeart } = useParticipant();
  if (!room) return null;
  return (
    <main className="participant-lobby">
      <WelcomeLobby room={room} />
      <ReactionBar
        tap={reactionTap}
        disabled={!connected}
        onSend={(kind) => void sendHeart(kind)}
      />
    </main>
  );
}
