import { ArrowUp, Cloud, MessageCircle, Trophy } from "lucide-react";
import { useHost } from "../HostContext";

export function TemplateChoices() {
  const { createSession } = useHost();
  return (
    <div className="template-grid">
      <button
        className="template-choice checkin"
        onClick={() => createSession("checkin")}
      >
        <span className="template-art">
          <Cloud size={48} />
          <span>hello, team.</span>
        </span>
        <div>
          <span className="eyebrow">CONNECTION</span>
          <h3>Team check-in</h3>
          <p>
            4 questions <span>·</span> Word cloud, poll + more
          </p>
          <ArrowUp className="tilted-arrow" size={20} />
        </div>
      </button>
      <button
        className="template-choice trivia"
        onClick={() => createSession("trivia")}
      >
        <span className="template-art">
          <Trophy size={48} />
          <span>big brain energy.</span>
        </span>
        <div>
          <span className="eyebrow">A LITTLE COMPETITION</span>
          <h3>The big team quiz</h3>
          <p>
            3 questions <span>·</span> Quiz + word cloud
          </p>
          <ArrowUp className="tilted-arrow" size={20} />
        </div>
      </button>
      <button
        className="template-choice retro"
        onClick={() => createSession("retro")}
      >
        <span className="template-art">
          <MessageCircle size={48} />
          <span>let’s talk about it.</span>
        </span>
        <div>
          <span className="eyebrow">REFLECTION</span>
          <h3>Sprint retrospective</h3>
          <p>
            4 questions <span>·</span> Open response + more
          </p>
          <ArrowUp className="tilted-arrow" size={20} />
        </div>
      </button>
    </div>
  );
}
