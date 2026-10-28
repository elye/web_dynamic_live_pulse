import { ListOrdered } from "lucide-react";
import { type QuestionMeta } from "../../ui/meta";

export const meta: QuestionMeta = {
  icon: ListOrdered,
  Thumbnail: () => <ListOrdered size={32} strokeWidth={1.5} />,
};
