import { ArrowUp, MessageCircleQuestion } from "lucide-react";
import { type QuestionResults } from "../../ui/results";

export const results: QuestionResults = {
  Results: ({ results, onUpvote, upvotedIds }) => (
    <div className="qna-results">
      {[...results]
        .sort((first, second) => second.count - first.count)
        .map((item, index) => (
          <div className="qna-entry" key={item.id ?? index}>
            <MessageCircleQuestion size={18} />
            <p>{item.text}</p>
            {onUpvote && item.id ? (
              <button
                type="button"
                className={`qna-upvote ${upvotedIds?.has(item.id) ? "chosen" : ""}`}
                onClick={() => onUpvote(item.id!)}
                aria-pressed={upvotedIds?.has(item.id)}
              >
                <ArrowUp size={14} />
                {item.count}
              </button>
            ) : (
              <span className="qna-upvote-count">
                <ArrowUp size={14} />
                {item.count}
              </span>
            )}
          </div>
        ))}
    </div>
  ),
  previewRows: () => [
    { id: "1", text: "What’s next for the roadmap?", count: 6 },
    { id: "2", text: "Can we see this in action?", count: 3 },
  ],
  emptyText: "Submitted questions will appear here as they arrive.",
  total: (_question, rows) => rows.length,
};
