import { MessageCircleQuestion } from "lucide-react";
import { ResponseSimulator } from "../../../features/results/ResponseSimulator";
import { type QuestionMeta } from "../../ui/meta";

export const meta: QuestionMeta = {
  icon: MessageCircleQuestion,
  Thumbnail: () => <MessageCircleQuestion size={32} strokeWidth={1.5} />,
  simulator: { label: "Simulate Q&A", Simulator: ResponseSimulator },
};
