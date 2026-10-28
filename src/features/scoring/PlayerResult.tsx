import { type Room } from "../../model";

const placeCopy = {
  1: { emoji: "🥇", title: "Congratulations, you won!", detail: "1st place" },
  2: {
    emoji: "🥈",
    title: "Congratulations, great job!",
    detail: "2nd place",
  },
  3: {
    emoji: "🥉",
    title: "Congratulations, well played!",
    detail: "3rd place",
  },
} as const;

/** The player's own result: a congratulation for podium finishers, a plain note otherwise. */
export function PlayerResult({ room }: { room: Room }) {
  const me = room.me;
  if (!me || !room.scored || me.score <= 0) return null;
  const score = `${me.score.toLocaleString()} pts`;
  if (me.rank <= 3) {
    const copy = placeCopy[me.rank as 1 | 2 | 3];
    return (
      <div
        className="participant-you-note player-result player-congrats"
        role="status"
      >
        <span className="player-congrats-emoji" aria-hidden="true">
          {copy.emoji}
        </span>
        <strong>{copy.title}</strong>
        <span>
          You finished in {copy.detail} with {score}
        </span>
      </div>
    );
  }
  return (
    <p className="participant-you-note player-result">
      You finished #{me.rank} of {me.total} with {score}
    </p>
  );
}
