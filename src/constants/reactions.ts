/** Reactions audiences can send. The heart stays in the middle of the picker. */
export const reactionOptions = [
  { kind: "clap", label: "Clap", emoji: "👏", color: "#e0a53a" },
  { kind: "smile", label: "Smile", emoji: "😊", color: "#e8b421" },
  { kind: "heart", label: "Heart", emoji: "", color: "#e0607e" },
  { kind: "star", label: "Star", emoji: "⭐", color: "#e8a317" },
  { kind: "tada", label: "Celebrate", emoji: "🎉", color: "#8a63d2" },
] as const;
