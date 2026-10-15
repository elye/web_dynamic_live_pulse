import { Check, Copy } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { buildClipboardPrompt, promptExamples } from "../../aiPrompt";
import { Modal } from "../../components/Modal";

export function AiPromptModal({
  onClose,
  onImportNext,
}: {
  onClose: () => void;
  onImportNext: () => void;
}) {
  const [request, setRequest] = useState("");
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState("");
  const fallbackRef = useRef<HTMLTextAreaElement>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const text = buildClipboardPrompt(request);
    try {
      await navigator.clipboard.writeText(text);
      setFallback("");
      setCopied(true);
    } catch {
      // Clipboard can be unavailable on insecure LAN origins; let the user copy manually.
      setCopied(false);
      setFallback(text);
      setTimeout(() => {
        fallbackRef.current?.focus();
        fallbackRef.current?.select();
      });
    }
  }
  return (
    <Modal title="Generate JSON with AI" onClose={onClose}>
      <form className="editor-form" onSubmit={(event) => void submit(event)}>
        <p className="muted">
          Generate a <strong>survey</strong> (no right answers), a{" "}
          <strong>quiz</strong> (scored, with correct answers), or a mix of
          both. Pick an example to start, then edit it.
        </p>
        <div className="prompt-examples" role="group" aria-label="Examples">
          {promptExamples.map((example) => (
            <button
              key={example.id}
              type="button"
              className="prompt-example"
              onClick={() => {
                setRequest(example.text);
                setCopied(false);
                setFallback("");
              }}
            >
              <strong>{example.label}</strong>
              <span>{example.hint}</span>
            </button>
          ))}
        </div>
        <label>
          What should your session be about?
          <textarea
            rows={6}
            maxLength={2000}
            value={request}
            placeholder="e.g. A 10-question retrospective for a product team, with a warm-up word cloud and a quiz about our launch."
            onChange={(event) => {
              setRequest(event.target.value);
              setCopied(false);
              setFallback("");
            }}
          />
        </label>
        {copied && (
          <p className="success-banner" role="status">
            <strong>Prompt copied!</strong> Paste it into any AI assistant
            (ChatGPT, Gemini, Claude, Google AI Studio…). Then copy the JSON it
            returns and use{" "}
            <button
              type="button"
              className="text-button"
              onClick={onImportNext}
            >
              Import JSON
            </button>{" "}
            to paste it here.
          </p>
        )}
        {fallback && (
          <label>
            Copy this prompt manually, then paste it into an AI assistant
            <textarea
              ref={fallbackRef}
              className="json-input"
              rows={8}
              readOnly
              value={fallback}
            />
          </label>
        )}
        <div className="modal-actions">
          <button className="button secondary" type="button" onClick={onClose}>
            Close
          </button>
          <button
            className="button primary"
            type="submit"
            disabled={!request.trim()}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied" : "Copy AI prompt"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
