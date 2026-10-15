import {
  ArrowRight,
  ArrowUp,
  Check,
  LoaderCircle,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { useParticipant } from "./ParticipantContext";

export function JoinPage() {
  const { code, setCode, name, setName, busy, connected, join } =
    useParticipant();
  return (
    <main className="join-page">
      <div className="join-decoration">
        <span className="join-shape">
          <MessageCircle size={45} />
        </span>
        <span className="join-spark">
          <Sparkles size={32} />
        </span>
        <span className="join-check">
          <Check size={27} />
        </span>
      </div>
      <span className="eyebrow">THE ROOM IS BETTER WITH YOU</span>
      <h1>
        You’re in good
        <br />
        <span>company.</span>
      </h1>
      <p>One room. Every voice.</p>
      <form onSubmit={join} className="join-form">
        <label>
          Room code
          <input
            autoFocus
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            minLength={6}
            required
            placeholder="000 000"
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            className="code-input"
          />
        </label>
        <label>
          Your name
          <input
            required
            maxLength={24}
            placeholder="What should we call you?"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="given-name"
          />
        </label>
        <button
          className="button primary full"
          disabled={busy || !connected || !name.trim() || code.length !== 6}
        >
          {busy ? (
            <LoaderCircle size={18} className="spin" />
          ) : (
            <>
              Join the room
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
      <a href="/" className="host-link">
        Hosting instead?
        <span>
          Open your workspace <ArrowUp size={14} className="tilted-arrow" />
        </span>
      </a>
    </main>
  );
}
