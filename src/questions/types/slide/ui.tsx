import { FileText } from "lucide-react";
import { type QuestionMeta } from "../../ui/meta";

export const meta: QuestionMeta = {
  icon: FileText,
  Thumbnail: () => (
    <div className="mini-slide">
      <FileText size={26} />
      <i />
      <i />
    </div>
  ),
  eyebrow: "A MOMENT TOGETHER",
  subtitle: (question) => (
    <p className="stage-slide-description">{question.description}</p>
  ),
};
