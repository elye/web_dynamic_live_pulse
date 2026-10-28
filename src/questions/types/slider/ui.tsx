import { SlidersHorizontal } from "lucide-react";
import { SliderSimulator } from "../../../features/results/SliderSimulator";
import { type QuestionMeta } from "../../ui/meta";

export const meta: QuestionMeta = {
  icon: SlidersHorizontal,
  Thumbnail: () => <SlidersHorizontal size={32} strokeWidth={1.5} />,
  simulator: { label: "Simulate slider", Simulator: SliderSimulator },
};
