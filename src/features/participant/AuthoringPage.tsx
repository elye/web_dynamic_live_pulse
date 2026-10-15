import { ReactionBar } from "../../components/ReactionBar";
import { AuthorQuestion } from "../crowd/AuthorQuestion";
import { useParticipant } from "./ParticipantContext";

export function AuthoringPage() {
  const {
    busy,
    reactionTap,
    live,
    room,
    connected,
    submitted,
    sendAuthored,
    sendHeart,
  } = useParticipant();
  if (!room?.crowd) return null;
  return (
    <main className="participant-session">
      <div className="participant-room">
        <span>{room.title}</span>
        <span>
          {room.code.slice(0, 3)} {room.code.slice(3)}
        </span>
      </div>
      <AuthorQuestion
        key={live.authored ? "restored" : "new"}
        kind={room.crowd.kind}
        initial={live.authored}
        draftKey={`pulse:author-draft:${room.code}`}
        sent={submitted.includes("crowd-authored")}
        busy={busy}
        disabled={!connected}
        onSubmit={(authored) => void sendAuthored(authored)}
      />
      <ReactionBar
        tap={reactionTap}
        disabled={!connected}
        onSend={(kind) => void sendHeart(kind)}
      />
    </main>
  );
}
