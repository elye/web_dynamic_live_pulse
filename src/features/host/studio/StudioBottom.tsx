import { ArrowRight, Sparkles } from "lucide-react";
import { useHost } from "../HostContext";

export function StudioBottom() {
  const { setPage } = useHost();
  return (
    <div className="studio-bottom">
      <span>
        <span className="sparkle-tile">
          <Sparkles size={16} />
        </span>
        A good question is where it all begins.
      </span>
      <button className="text-button" onClick={() => setPage("templates")}>
        Explore templates
        <ArrowRight size={15} />
      </button>
    </div>
  );
}
