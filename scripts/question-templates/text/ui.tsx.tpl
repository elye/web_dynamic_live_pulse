import { Sparkles } from "lucide-react";
import { ResponseSimulator } from "../../../features/results/ResponseSimulator";
import { type QuestionMeta } from "../../ui/meta";

// TODO(new-question): pick an icon and draw a small thumbnail (styles live in src/styles).
export const meta: QuestionMeta = {
  icon: Sparkles,
  Thumbnail: () => (
    <div className="mini-message">
      <Sparkles size={30} />
      <i />
      <i />
    </div>
  ),
  simulator: {
    label: "Simulate __LABEL__ responses",
    Simulator: ResponseSimulator,
  },
};
