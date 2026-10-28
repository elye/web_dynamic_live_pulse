import { MessageCircle } from "lucide-react";
import { type ResultRow } from "../../questions";

/** Open responses as a list of speech lines, optionally naming who each one is for. */
export function TextResults({
  results,
  showTarget = false,
}: {
  results: ResultRow[];
  showTarget?: boolean;
}) {
  return (
    <div className="text-results">
      {results.map((item, index) => (
        <div className="text-response" key={`${item.text}-${index}`}>
          <MessageCircle size={18} />
          <p>
            {showTarget && item.target && <strong>For {item.target}: </strong>}
            {item.text}
          </p>
          {item.count > 1 && <span>×{item.count}</span>}
        </div>
      ))}
    </div>
  );
}
