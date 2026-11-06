import { FileText } from "lucide-react";
import { Markdown } from "../../../components/Markdown";
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
    <Markdown className="stage-slide-description">
      {question.description ?? ""}
    </Markdown>
  ),
};
