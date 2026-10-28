import { MessageCircle } from "lucide-react";
import { ResponseSimulator } from "../../../features/results/ResponseSimulator";
import { type QuestionMeta } from "../../ui/meta";

export const meta: QuestionMeta = {
  icon: MessageCircle,
  Thumbnail: () => (
    <div className="mini-message">
      <MessageCircle size={30} />
      <i />
      <i />
    </div>
  ),
  simulator: { label: "Simulate open responses", Simulator: ResponseSimulator },
};
