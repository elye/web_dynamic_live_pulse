import { LayoutGrid } from "lucide-react";
import { type QuestionMeta } from "../../ui/meta";

export const meta: QuestionMeta = {
  icon: LayoutGrid,
  Thumbnail: () => <LayoutGrid size={32} strokeWidth={1.5} />,
};
