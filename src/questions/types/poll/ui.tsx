import { BarChart3 } from "lucide-react";
import { PollSimulator } from "../../../features/results/PollSimulator";
import { type QuestionMeta } from "../../ui/meta";

export const meta: QuestionMeta = {
  icon: BarChart3,
  Thumbnail: () => (
    <div className="mini-bars">
      <i />
      <i />
      <i />
      <i />
    </div>
  ),
  simulator: { label: "Simulate multiple choice", Simulator: PollSimulator },
};
