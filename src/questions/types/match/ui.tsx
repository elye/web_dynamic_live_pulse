import { ArrowLeftRight } from "lucide-react";
import { type QuestionMeta } from "../../ui/meta";

export const meta: QuestionMeta = {
  icon: ArrowLeftRight,
  Thumbnail: () => <ArrowLeftRight size={32} strokeWidth={1.5} />,
};
