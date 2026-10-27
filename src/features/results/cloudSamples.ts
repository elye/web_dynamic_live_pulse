export const SAMPLE_LIMIT = 300;

const curatedWords = [
  "excited", "curious", "inspired", "optimistic", "energized", "ready",
  "focused", "grateful", "creative", "hopeful", "connected", "calm",
  "motivated", "confident", "happy", "refreshed", "thoughtful", "engaged",
  "open-minded", "supported", "learning", "growing", "together", "proud",
  "determined", "playful", "brave", "balanced", "welcomed", "resilient",
  "reflective", "recharged", "ambitious", "inquisitive", "purposeful",
  "relaxed", "in the zone", "new ideas", "team spirit", "a fresh start",
  "possibility", "progress", "collaboration", "clarity", "trust", "momentum",
  "discovery", "kindness", "joy", "adventure", "perspective", "imagination",
  "belonging", "patience", "growth", "energy", "courage", "potential",
  "connection", "inspiration",
];

const moreWords = [
  "alert", "amazed", "appreciated", "authentic", "awake", "aware", "bold",
  "bright", "buzzing", "capable", "caring", "centered", "challenged",
  "cheerful", "committed", "compassionate", "complete", "composed",
  "content", "cooperative", "cozy", "daring", "dedicated", "delighted",
  "dependable", "driven", "eager", "easygoing", "elated", "empowered",
  "encouraged", "enthusiastic", "equipped", "fearless", "fulfilled",
  "fun", "generous", "gentle", "genuine", "glad", "glowing", "grounded",
  "harmonious", "helpful", "honest", "humble", "humorous", "idealistic",
  "innovative", "insightful", "intrigued", "invested", "involved",
  "jolly", "keen", "lively", "lucky", "mindful", "natural", "nimble",
  "noticed", "nurtured", "observant", "open", "organized", "outgoing",
  "passionate", "peaceful", "persistent", "positive", "powerful",
  "present", "productive", "quick", "radiant", "rested", "respected",
  "rewarded", "satisfied", "secure", "serene", "sharp", "silly", "sincere",
  "spirited", "steady", "strong", "sunny", "sure", "tenacious", "tranquil",
  "understood", "united", "upbeat", "valued", "vibrant", "vivid", "warm",
  "welcoming", "wise", "wonder", "zesty", "agility", "alignment",
  "ambition", "appreciation", "balance", "beginnings", "breakthrough",
  "bridges", "celebration", "challenge", "change", "coffee", "comfort",
  "community", "confidence", "connection points", "conversation",
  "craft", "culture", "curiosity", "deadlines", "delivery", "design",
  "direction", "diversity", "drive", "empathy", "endurance", "engagement",
  "excitement", "experiments", "fairness", "feedback", "flexibility",
  "flow", "focus time", "freedom", "friendship", "fresh air", "fun times",
  "generosity", "goals", "gratitude", "harmony", "health", "honesty",
  "hope", "humility", "humour", "ideas", "impact", "innovation",
  "integrity", "journey", "laughter", "leadership", "lessons", "listening",
  "lunch", "mentoring", "milestones", "mindset", "mission", "motivation",
  "music", "new friends", "openness", "optimism", "ownership", "partnership",
  "passion", "pride", "purpose", "quality", "quiet", "reflection",
  "resilience", "respect", "rest", "results", "sharing", "simplicity",
  "snacks", "solutions", "spark", "stories", "strength", "success",
  "support", "sustainability", "teamwork", "tenacity", "thanks",
  "transparency", "understanding", "unity", "values", "vision", "wellbeing",
  "wins", "wisdom", "workshops", "big picture", "fresh eyes", "good vibes",
  "great energy", "hard work", "kind words", "long weekend", "next steps",
  "open door", "quick wins", "small steps", "shared goals", "solid plan",
  "sunny day", "team lunch", "time together", "warm welcome", "work-life balance",
  "bright future", "clear mind", "full of ideas", "ready to learn",
  "can-do attitude", "happy place", "light-hearted", "good morning",
  "eager to start", "feeling lucky", "on a roll", "all smiles",
  "coffee first", "ahead of time", "one step ahead", "making waves",
  "sparking joy", "head in the clouds", "open to change", "heart full",
  "inspired by you", "never stop learning", "look forward", "above and beyond",
];

const curatedEmoji = [
  "😀", "😍", "🤩", "😎", "🥳", "😊", "🤗", "😌", "🤔", "😴",
  "🔥", "✨", "🌟", "💡", "🎉", "🎈", "🚀", "🌈", "☀️", "🌙",
  "🌱", "🌸", "🍀", "🌊", "⛰️", "🎯", "🏆", "💪", "👏", "🙌",
  "👍", "🙏", "❤️", "💚", "💙", "💛", "🧠", "👀", "🎵", "🎨",
  "📚", "☕", "🍕", "🍩", "🍎", "🐢", "🦋", "🐝", "🦄", "🐼",
  "⚡", "🎁", "🧩", "🔑", "🧭", "⏳", "🌍", "🏝️", "🎸", "🤝",
];

/** Every code point in these ranges is a standard emoji. */
const emojiRanges: [number, number][] = [
  [0x1f600, 0x1f64f], // faces and gestures
  [0x1f400, 0x1f4fc], // animals, objects and symbols
  [0x1f680, 0x1f6c5], // transport
  [0x1f950, 0x1f96b], // food
];

function unique(items: string[]) {
  return [...new Set(items)];
}

export const sampleWords = unique([...curatedWords, ...moreWords]).slice(
  0,
  SAMPLE_LIMIT,
);

export const sampleEmoji = unique([
  ...curatedEmoji,
  ...emojiRanges.flatMap(([from, to]) =>
    Array.from({ length: to - from + 1 }, (_, index) =>
      String.fromCodePoint(from + index),
    ),
  ),
]).slice(0, SAMPLE_LIMIT);
