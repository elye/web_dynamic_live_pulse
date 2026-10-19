import { canCompete, labels } from "../../../model";
import { useParticipant } from "../ParticipantContext";

export function QuestionHeader() {
  const { live, room, question } = useParticipant();
  if (!room || !question) return null;
  return (
    <>
      <div className="participant-room">
        <span>{room.title}</span>
        <span>
          {room.code.slice(0, 3)} {room.code.slice(3)}
        </span>
      </div>
      <div className="participant-progress">
        {room.questions.map((item, index) => (
          <span
            key={item.id}
            className={index <= room.active ? "complete" : ""}
          />
        ))}
      </div>
      <span className="eyebrow">
        QUESTION {room.active + 1} OF {room.questions.length} ·{" "}
        {labels[question.type]}
      </span>
      {question.author && (
        <span className="participant-author">
          A question from{" "}
          <strong className="author-name">{question.author}</strong>
        </span>
      )}
      <h1>{question.title}</h1>
      {question.type === "peerpraise" && question.assignedTo && (
        <div className="peerpraise-target">
          <strong>{question.assignedTo}</strong>
        </div>
      )}
      {question.author &&
        question.author === live.credentials()?.name &&
        canCompete(question.type) && (
          <p className="author-note">
            You wrote this one, so it won’t score for you.
          </p>
        )}
    </>
  );
}
