import { Drama } from "lucide-react";
import { PollSimulator } from "../../../features/results/PollSimulator";
import { type QuestionMeta } from "../../ui/meta";

export const meta: QuestionMeta = {
  icon: Drama,
  Thumbnail: () => <Drama size={32} strokeWidth={1.5} />,
  simulator: { label: "Simulate multiple choice", Simulator: PollSimulator },
};
