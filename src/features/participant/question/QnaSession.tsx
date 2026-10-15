import { CheckCheck, LoaderCircle, Pause, Send } from "lucide-react";
import { ResultsVisual } from "../../results/ResultsVisual";
import { useParticipant } from "../ParticipantContext";

export function QnaSession() {
  const {
    busy,
    setAnswer,
    setAnswerQuestion,
    room,
    connected,
    question,
    currentUpvoted,
    currentAnswer,
    hasSubmitted,
    vote,
    upvote,
  } = useParticipant();
  if (!room || !question) return null;
  return (
    <div className="qna-session">
      {!hasSubmitted && room.accepting ? (
        <form onSubmit={vote} className="answer-form qna-submit-form">
          <label>
            Ask your question
            <textarea
              rows={3}
              maxLength={280}
              required
              placeholder="What would you like to ask?"
              value={String(currentAnswer)}
              onChange={(event) => {
                setAnswer(event.target.value);
                setAnswerQuestion(question.id);
              }}
            />
            <small className="character-count">
              {String(currentAnswer).length} / 280
            </small>
          </label>
          <button
            className="button primary full"
            disabled={
              busy ||
              !connected ||
              !(typeof currentAnswer === "string" && currentAnswer.trim())
            }
          >
            {busy ? (
              <LoaderCircle className="spin" size={18} />
            ) : (
              <>
                <Send size={17} />
                Submit question
              </>
            )}
          </button>
        </form>
      ) : hasSubmitted ? (
        <div className="qna-submitted-note">
          <CheckCheck size={20} />
          Your question is in. Keep upvoting the ones you like most.
        </div>
      ) : (
        <div className="qna-submitted-note">
          <Pause size={20} />
          Your host has paused new questions. You can still upvote.
        </div>
      )}
      <ResultsVisual
        question={question}
        onUpvote={(entrantId) => void upvote(entrantId)}
        upvotedIds={currentUpvoted}
      />
    </div>
  );
}
