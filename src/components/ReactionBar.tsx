import { Heart } from "lucide-react";
import { reactionOptions } from "../constants/reactions";

/** The audience's row of reaction buttons, shown in the lobby and during questions. */
export function ReactionBar({
  tap,
  disabled,
  onSend,
}: {
  tap: { kind: string; count: number };
  disabled: boolean;
  onSend: (kind: string) => void;
}) {
  return (
    <div className="reaction-bar" role="group" aria-label="Send a reaction">
      {reactionOptions.map((option) => (
        <button
          type="button"
          key={option.kind}
          className={`heart-button reaction-${option.kind}`}
          aria-label={
            option.kind === "heart" ? "Send a heart" : `Send ${option.label}`
          }
          onClick={() => onSend(option.kind)}
          disabled={disabled}
          style={{ ["--reaction-color" as string]: option.color }}
        >
          <span
            key={tap.kind === option.kind ? tap.count : 0}
            className={tap.kind === option.kind ? "heart-tapped" : ""}
          >
            {option.kind === "heart" ? (
              <Heart size={24} fill="currentColor" />
            ) : (
              <span className="reaction-emoji">{option.emoji}</span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
