import { Cloud } from "lucide-react";
import { CloudSimulator } from "../../../features/results/CloudSimulator";
import { type QuestionMeta } from "../../ui/meta";

export const meta: QuestionMeta = {
  icon: Cloud,
  Thumbnail: () => (
    <div className="mini-cloud">
      <span>curious</span>
      <b>excited</b>
      <span>inspired</span>
    </div>
  ),
  subtitle: () => <p>One word. All the feels.</p>,
  simulator: { label: "Simulate word cloud", Simulator: CloudSimulator },
};
