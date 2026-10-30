import { BarChart3, Download, RotateCcw } from "lucide-react";
import { exportResults, labels, type Room } from "../../model";
import { traitsOf } from "../../questions";
import { useHost } from "../host/HostContext";
import { ResultsVisual } from "../results/ResultsVisual";
import { Leaderboard } from "../scoring/Leaderboard";
import { Podium } from "../scoring/Podium";

export function ResultsPage({ room }: { room: Room | null }) {
  const { busy, connected, restartSession } = useHost();
  return (
    <div className="results-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">THE BIG PICTURE</span>
          <h1>Every response counts.</h1>
        </div>
        {room && (
          <div className="heading-actions">
            <button
              className="button secondary"
              onClick={() => exportResults(room)}
            >
              <Download size={17} />
              Export CSV
            </button>
            {room.ended && (
              <button
                className="button primary"
                onClick={() => void restartSession()}
                disabled={!connected || busy}
              >
                <RotateCcw size={17} />
                {busy ? "Restarting..." : "Restart session"}
              </button>
            )}
          </div>
        )}
      </div>
      {!room ? (
        <div className="empty-page">
          <BarChart3 size={44} />
          <h2>A fresh start.</h2>
          <p>Your session results will be here after you go live.</p>
        </div>
      ) : (
        <>
          <div className="stats-band">
            <div>
              <span>Session</span>
              <strong>{room.title}</strong>
            </div>
            <div>
              <span>Participants</span>
              <strong>{room.participants}</strong>
            </div>
            <div>
              <span>Responses</span>
              <strong>
                {room.questions.reduce(
                  (sum, question) => sum + (question.responses || 0),
                  0,
                )}
              </strong>
            </div>
            <div>
              <span>Questions</span>
              <strong>{room.questions.length}</strong>
            </div>
          </div>
          <Podium room={room} />
          {room.questions
            .filter((question) => traitsOf(question.type).collectsAnswers)
            .map((question, index) => (
              <section className="result-section" key={question.id}>
                <span className="eyebrow">
                  {String(index + 1).padStart(2, "0")} / {labels[question.type]}
                  {question.author ? ` · by ${question.author}` : ""}
                </span>
                <h2>{question.title}</h2>
                <ResultsVisual question={question} reveal />
              </section>
            ))}
          {room.leaderboard.some((entry) => entry.score > 0) && (
            <Leaderboard room={room} />
          )}
        </>
      )}
    </div>
  );
}
