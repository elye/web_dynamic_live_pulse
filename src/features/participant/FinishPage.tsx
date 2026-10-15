import { ArrowRight, CheckCheck } from "lucide-react";
import { Leaderboard } from "../scoring/Leaderboard";
import { Podium } from "../scoring/Podium";
import { useParticipant } from "./ParticipantContext";

export function FinishPage() {
  const { room } = useParticipant();
  if (!room) return null;
  return (
    <main className="participant-finish">
      <span className="finish-icon">
        <CheckCheck size={42} />
      </span>
      <span className="eyebrow">THAT’S A WRAP</span>
      <h1>
        Good things happen
        <br />
        when you show up.
      </h1>
      <p>Thanks for being part of {room.title}.</p>
      <Podium room={room} />
      {room.leaderboard.some((entry) => entry.score > 0) && (
        <Leaderboard room={room} />
      )}
      <a className="button primary" href="/join">
        Join another session
        <ArrowRight size={17} />
      </a>
    </main>
  );
}
