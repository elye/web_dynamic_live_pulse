import { Users } from "lucide-react";
import { PeerPraiseSimulator } from "../../../features/results/PeerPraiseSimulator";
import { type QuestionMeta } from "../../ui/meta";

export const meta: QuestionMeta = {
  icon: Users,
  Thumbnail: () => <Users size={32} strokeWidth={1.5} />,
  simulator: { label: "Simulate peer praise", Simulator: PeerPraiseSimulator },
};
