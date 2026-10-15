import { ArrowRight, Eye, EyeOff, Pause, Play, Trophy } from "lucide-react";
import { canCompete, hasRevealMode } from "../../../model";
import { useHost } from "../HostContext";

export function LiveControls() {
  const {
    setModal,
    busy,
    room,
    currentIndex,
    question,
    questionList,
    control,
    move,
  } = useHost();
  if (!room) return null;
  return (
    <div className="live-controls">
      {question.type !== "slide" && (
        <button
          className="button secondary"
          onClick={() => void control("toggle")}
          disabled={busy}
        >
          {room.accepting ? <Pause size={16} /> : <Play size={16} />}
          {room.accepting ? "Pause responses" : "Reopen responses"}
        </button>
      )}
      {question.type !== "slide" &&
        question.type !== "qna" &&
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
      {(() => {
        const last = currentIndex === questionList.length - 1;
        // Each click advances one step: show results, then the top 10
        // ranking (answered questions, not the last one), then the next
        // question. After the last question a session with answered
        // questions ends on the podium before it is finished.
        // Questions already showing results on the fly skip the first step,
        // except answered ones, whose correct answer still needs a reveal.
        const showFirst =
          hasRevealMode(question.type) &&
          (question.revealMode !== "live" || canCompete(question.type)) &&
          !room.revealed;
        const showRanking =
          !showFirst &&
          !last &&
          canCompete(question.type) &&
          question.showRanking !== false &&
          !room.ranking;
        const showPodium = !showFirst && last && room.scored && !room.podium;
        return (
          <button
            className="button primary"
            onClick={() =>
              showFirst
                ? void control("reveal")
                : showRanking
                  ? void control("ranking")
                  : showPodium
                    ? void control("podium")
                    : last
                      ? setModal("end")
                      : move(1)
            }
            disabled={busy}
          >
            {showFirst ? (
              <>
                <Eye size={17} />
                Show results
              </>
            ) : showRanking ? (
              <>
                <Trophy size={17} />
                Show ranking
              </>
            ) : showPodium ? (
              <>
                <Trophy size={17} />
                Show podium
              </>
            ) : (
              <>
                {last ? "Finish session" : "Next question"}
                <ArrowRight size={17} />
              </>
            )}
          </button>
        );
      })()}
    </div>
  );
}
