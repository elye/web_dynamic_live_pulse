import { type ComponentType, type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { type Question } from "../registry";

export type SimulatorProps = {
  question: Question;
  theme: string;
  onClose: () => void;
};

/** How a question type looks in the host's lists and on the stage. Words live on the definition. */
export type QuestionMeta = {
  icon: LucideIcon;
  /** The small picture on the question rail. */
  Thumbnail: ComponentType;
  /** The line above the title on the stage, when it differs from the usual one. */
  eyebrow?: string;
  /** Extra text under the title on the stage. */
  subtitle?(question: Question): ReactNode;
  /** The host's "try it with fake players" tool, for types that have one. */
  simulator?: { label: string; Simulator: ComponentType<SimulatorProps> };
};
