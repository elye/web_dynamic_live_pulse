import { ArrowRight, Eye, EyeOff, Pause, Play, Trophy } from "lucide-react";
import { traitsOf } from "../../../questions";
import { useHost } from "../HostContext";
import { useAdvance } from "./useAdvance";

export function LiveControls() {
  const { busy, room, question, control } = useHost();
  const { step, blocked, advance } = useAdvance();
  if (!room) return null;
  const traits = traitsOf(question.type);
  return (
    <div className="live-controls">
      {traits.collectsAnswers && (
        <button
          className="button secondary"
          onClick={() => void control("toggle")}
          disabled={busy}
        >
          {room.accepting ? <Pause size={16} /> : <Play size={16} />}
          {room.accepting ? "Pause responses" : "Reopen responses"}
        </button>
      )}
      {traits.collectsAnswers &&
        !traits.resultsAlwaysVisible &&
        (question.revealMode === "live" && !room.revealed ? (
          <button
            className="button secondary"
            onClick={() => void control(room.hidden ? "show" : "hide")}
            disabled={busy}
          >
            {room.hidden ? <Eye size={17} /> : <EyeOff size={17} />}
            {room.hidden ? "Show responses" : "Hide responses"}
          </button>
        ) : (
          <button
            className="button secondary"
            onClick={() => void control("reveal")}
            disabled={room.revealed || busy}
          >
            <Eye size={17} />
            {room.revealed ? "Results revealed" : "Reveal results"}
          </button>
        ))}
      <button
        className="button primary"
        onClick={advance}
        disabled={blocked}
        title={
          room.suspense && !room.podium
            ? "Use the big button on the slide to reveal the podium"
            : undefined
        }
      >
        {step === "results" ? (
          <>
            <Eye size={17} />
            Show results
          </>
        ) : step === "ranking" ? (
          <>
            <Trophy size={17} />
            Show ranking
          </>
        ) : step === "podium" ? (
          <>
            <Trophy size={17} />
            Show podium
          </>
        ) : (
          <>
            {step === "finish" ? "Finish session" : "Next question"}
            <ArrowRight size={17} />
          </>
        )}
      </button>
    </div>
  );
}
