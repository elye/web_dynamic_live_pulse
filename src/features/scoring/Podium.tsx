import { Trophy } from "lucide-react";
import { Confetti } from "../../components/Confetti";
import { type Room } from "../../model";

const medals = ["gold", "silver", "bronze"] as const;

/** Podium for the top three players of a competitive session, with confetti. */
export function Podium({ room }: { room: Room }) {
  const winners = room.leaderboard
    .slice(0, 3)
    .filter((entry) => entry.score > 0);
  if (!(room.ended || room.podium) || !room.scored || !winners.length)
    return null;
  // Visual order on the podium: silver, gold, bronze.
  const order = [1, 0, 2].filter((index) => winners[index]);
  return (
    <section className="podium-section" aria-label="Final podium">
      {/* 3rd, 2nd and 1st place rise one after another; confetti follows the winner. */}
      <Confetti delay={3500} />
      <Trophy size={32} className="podium-trophy" />
      <h2>And the winners are…</h2>
      <div className="podium">
        {order.map((index) => (
          <div className={`podium-place place-${index + 1}`} key={index}>
            <span
              className={`medal medal-${medals[index]}`}
              aria-label={`${medals[index]} medal`}
            >
              {index + 1}
            </span>
            <div className="podium-name-line">
              <strong className="podium-name">{winners[index].name}</strong>
              <span
                className="podium-name-source"
                role="img"
                aria-label={
                  winners[index].generated
                    ? "Generated name"
                    : "Provided name"
                }
                title={
                  winners[index].generated
                    ? "Generated participant name"
                    : "Name provided by the participant"
                }
              >
                {winners[index].generated ? "✨" : "👤"}
              </span>
            </div>
            <span className="podium-score">
              {winners[index].score.toLocaleString()} pts
            </span>
            <div className="podium-block" />
          </div>
        ))}
      </div>
    </section>
  );
}
