/** The shared vocabulary of the question platform. Nothing here knows about a specific question type. */

export type RevealMode = "live" | "onDone";
export type PollDisplay = "list" | "pie" | "stacked" | "bar";
export type VoteColor = { min: number; color: string };

/** What a player sent for one question; the shape depends on the question type. */
export type Answer =
  string | number | number[] | string[] | { x: number; y: number } | null;

export type ResultRow = {
  text: string;
  count: number;
  id?: string;
  target?: string;
};

/**
 * A question as every layer stores it. Type-specific fields are optional here; each
 * definition owns the fields it uses and the platform never reads them.
 */
export type QuestionRecord = {
  id: string;
  type: string;
  title: string;
  description?: string;
  options: string[];
  correct: number | null;
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
  revealMode?: RevealMode;
  competitive?: boolean;
  /** Multiple choice polls, quizzes and many options: participants may pick more than one option. */
  multiple?: boolean;
  /** Many options: add an "Others" box after the options. */
  others?: boolean;
  /** Many options: box colour by vote count (default red at 0, green from 1). */
  voteColors?: VoteColor[];
  /** How poll responses are displayed on the results slide. */
  pollDisplay?: PollDisplay;
  /** Multi-answer quizzes: every correct option (zero-based). Points need exactly these. */
  corrects?: number[];
  /** Show the top-10 ranking after this question's results (answered questions only). */
  showRanking?: boolean;
  /** Word clouds: maximum contributions one participant can submit. */
  maxSubmissions?: number;
  /** Name of the player who wrote this question (player-made sessions only). */
  author?: string;
  /** The participant-specific name assigned for a peer praise question. */
  assignedTo?: string;
  responses?: number;
  results?: ResultRow[];
};

/** Fields a definition may add on top of the common ones. */
export type TypeFields = Partial<
  Omit<
    QuestionRecord,
    | "id"
    | "type"
    | "title"
    | "options"
    | "revealMode"
    | "competitive"
    | "showRanking"
  >
>;

/** Untrusted input: an import file, a request body or a player's form. */
export type RawQuestion = Record<string, unknown>;

export type OptionRule = {
  min: number;
  max: number;
  maxLength: number;
  /** Shown when the options break the rule. */
  message: string;
};

/**
 * Facts about a question type that the platform needs to run it. The platform asks these
 * questions; it never compares against a type name.
 */
export type Traits = {
  /** False when there is nothing to answer (a slide). */
  collectsAnswers: boolean;
  /** Has a right answer, so it is scored, can be competitive and appears in rankings. */
  scored: boolean;
  /** The host can choose when responses appear, and hide or show them. */
  revealMode: boolean;
  defaultRevealMode: RevealMode;
  /** Results are always visible to everyone, whatever the reveal state. */
  resultsAlwaysVisible: boolean;
  /** Players can write a question of this type themselves. */
  playerAuthorable: boolean;
  /** Each player is given another player to write about. */
  assignsTargets: boolean;
  /** Players can upvote each other's answers. */
  upvotes: boolean;
  /** The options stay on the stage while responses are hidden. */
  optionsVisibleWhenHidden: boolean;
  /** The axes or range stay on the stage while responses are hidden. */
  frameVisibleWhenHidden: boolean;
};

export type ResultsEnv = {
  /** The token of the player behind each value, in the same order. */
  tokens: string[];
  upvotes(token: string): number;
  targetName(token: string): string;
};

export type DefinitionAnswer<Q extends QuestionRecord = QuestionRecord> = {
  /** Checks one submission and returns the value to store. Throws a player-readable error. */
  parse(question: Q, value: unknown): Answer;
  /** Words for what the player sent, e.g. "A. Jupiter". */
  describe(question: Q, answer: Answer): string;
  /** A plausible answer for load testing; `random` returns a number in [0, 1). */
  simulate(question: Q, random: () => number): Answer;
  /** More than one submission per player: how many are allowed. */
  limit?(question: Q): number;
};

export type QuestionDefinition<K extends string = string> = {
  kind: K;
  label: string;
  /** One line shown when adding a question. */
  hint: string;
  /** One line under the title once a question of this type is selected. */
  tagline: string;
  traits: Traits;
  /** The question's text is fixed (two truths and a lie always asks the same thing). */
  fixedTitle?: string;
  /** Rules for the options, or null when the type has none. */
  options: OptionRule | null;
  /**
   * Settings only this type accepts. Another type setting one of them (other than `false`)
   * is rejected, so no stray setting survives a type change.
   */
  settings?: readonly string[];
  /** A new question of this type, ready to edit. */
  create(): {
    title: string;
    options: string[];
    correct: number | null;
  } & TypeFields;
  /** Validates this type's own fields. Return `correct` to take over validating it. */
  parse?(
    raw: RawQuestion,
    context: { options: string[]; canonical: boolean },
  ): TypeFields;
  /** The type's own fields in an export. */
  serialize?(question: QuestionRecord): Record<string, unknown>;
  answer: DefinitionAnswer;
  results: {
    aggregate(
      question: QuestionRecord,
      values: unknown[],
      env: ResultsEnv,
    ): ResultRow[];
  };
  /** Share of the points earned (0 to 1). Defaults to all-or-nothing on `correct`. */
  score?(question: QuestionRecord, answer: unknown): number;
  /** The player's own form, mapped onto a question of this type. */
  author?: {
    toRaw(input: Record<string, unknown>): RawQuestion;
  };
  /** What the AI prompt tells a model about this type. */
  prompt: { purpose: string; rules: string };
};
