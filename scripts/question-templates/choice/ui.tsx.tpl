import { Sparkles } from "lucide-react";
import { PollSimulator } from "../../../features/results/PollSimulator";
import { type QuestionMeta } from "../../ui/meta";

// TODO(new-question): pick an icon and draw a small thumbnail (styles live in src/styles).
export const meta: QuestionMeta = {
  icon: Sparkles,
  Thumbnail: () => (
    <div className="mini-bars">
      <i />
      <i />
      <i />
      <i />
    </div>
  ),
  simulator: { label: "Simulate __LABEL__", Simulator: PollSimulator },
};
