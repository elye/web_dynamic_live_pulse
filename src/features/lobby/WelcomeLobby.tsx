import { Play, Users, Zap } from "lucide-react";
import { labels, type Room } from "../../model";
import { ShareDetails } from "../share/ShareDetails";
import { LobbyNames } from "./LobbyNames";

export function WelcomeLobby({
  room,
  theme = "mint",
  host = false,
  onStart,
  disabled,
  startLabel = "Start questions",
}: {
  room: Room;
  theme?: string;
  host?: boolean;
  onStart?: () => void;
  disabled?: boolean;
  startLabel?: string;
}) {
  return (
    <section
      className={`welcome-lobby theme-${theme} ${host ? "host-lobby" : ""}`}
      aria-label="Welcome lobby"
    >
      <div className="lobby-intro">
        <div>
          <span className="eyebrow">
            {host ? "WELCOME TO THE SESSION" : room.title}
          </span>
          <h1>{host ? room.title : "Welcome, everyone."}</h1>
          <span className="lobby-waiting">
            <span className="live-indicator" />
            {host ? "The room is open" : "You're in"}
          </span>
        </div>
        {host && (
          <button
            className="button primary"
            disabled={disabled}
            onClick={onStart}
          >
            <Play size={17} />
            {startLabel}
          </button>
        )}
      </div>
      <div className="lobby-body">
        {host ? (
          <div className="lobby-join">
            <h2>Join the session</h2>
            <ShareDetails code={room.code} nameless={room.nameless} inline />
          </div>
        ) : (
          <div className="lobby-code">
            <span>ROOM CODE</span>
            <strong>
              {room.code.slice(0, 3)} {room.code.slice(3)}
            </strong>
          </div>
        )}
        <div className="lobby-roster">
          <div
            className="lobby-count"
            role="status"
            aria-label="Total participants joined"
          >
            <Users size={22} />
            <strong>{room.participants}</strong>
            <span>
              {room.participants === 1
                ? "participant joined"
                : "participants joined"}
            </span>
          </div>
          {room.nameless ? (
            <div className="lobby-empty lobby-anonymous">
              <Users size={32} strokeWidth={1.3} />
              <p>Participant names are generated for this session</p>
            </div>
          ) : (
            <LobbyNames names={room.participantNames} max={host ? 120 : 56} />
          )}
        </div>
      </div>
      <div className="lobby-footer">
        <span className="stage-brand">
          <Zap size={16} fill="currentColor" />
          pulse.
        </span>
        <span>
          {host
            ? "Everyone in? Let's begin."
            : room.crowd
              ? `Soon you'll write a ${labels[room.crowd.kind]} question.`
              : "Waiting for your host to start."}
        </span>
      </div>
    </section>
  );
}
