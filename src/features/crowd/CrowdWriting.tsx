import { Play, Users, Zap } from "lucide-react";
import { labels, type Room } from "../../model";
import { ShareDetails } from "../share/ShareDetails";

/** Host view while players write their questions. */
export function CrowdWriting({
  room,
  theme,
  disabled,
  onStart,
}: {
  room: Room;
  theme: string;
  disabled: boolean;
  onStart: () => void;
}) {
  const crowd = room.crowd!;
  const total = Math.max(room.participants, 1);
  return (
    <section
      className={`welcome-lobby host-lobby crowd-writing theme-${theme}`}
      aria-label="Players are writing questions"
    >
      <div className="lobby-intro">
        <div>
          <span className="eyebrow">
            PLAYER-MADE QUESTIONS · {labels[crowd.kind].toLocaleUpperCase()}
          </span>
          <h1>Players are writing their questions</h1>
          <span className="lobby-waiting">
            <span className="live-indicator" />
            Each player adds one {labels[crowd.kind]} question
          </span>
        </div>
        <button
          className="button primary"
          disabled={disabled || crowd.submitted === 0}
          onClick={onStart}
        >
          <Play size={17} />
          Start game
        </button>
      </div>
      <div className="lobby-body">
        <div className="lobby-join">
          <h2>Join the session</h2>
          <ShareDetails code={room.code} inline />
        </div>
        <div className="lobby-roster">
          <div
            className="lobby-count"
            role="status"
            aria-label="Questions submitted"
          >
            <Users size={22} />
            <strong>{crowd.submitted}</strong>
            <span>
              of {room.participants}{" "}
              {room.participants === 1 ? "question" : "questions"} in
            </span>
          </div>
          <div className="crowd-progress" aria-hidden="true">
            <span
              style={{
                width: `${Math.min(100, (crowd.submitted / total) * 100)}%`,
              }}
            />
          </div>
          {crowd.waiting.length ? (
            <div className="crowd-waiting">
              <h2>Still writing</h2>
              <ul>
                {crowd.waiting.map((name, index) => (
                  <li key={index} className={`color-${index % 4}`}>
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="crowd-waiting">
              <h2>Everyone is ready</h2>
            </div>
          )}
        </div>
      </div>
      <div className="lobby-footer">
        <span className="stage-brand">
          <Zap size={16} fill="currentColor" />
          pulse.
        </span>
        <span>
          You can start as soon as at least one question is in. Questions are
          played in random order.
        </span>
      </div>
    </section>
  );
}
