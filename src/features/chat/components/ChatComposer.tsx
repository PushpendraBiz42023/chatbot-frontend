import { useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "../../../components/Button";

interface ChatComposerProps {
  isStreaming: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}

const MAX_LENGTH = 8000;

/** Enter sends, Shift+Enter inserts a newline, Esc stops an in-flight stream. */
export function ChatComposer({ isStreaming, onSend, onStop }: ChatComposerProps) {
  const [value, setValue] = useState("");
  const textareaId = useId();

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setValue("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSend();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
      return;
    }
    if (event.key === "Escape" && isStreaming) {
      event.preventDefault();
      onStop();
    }
  };

  return (
    <form className="chat-composer" onSubmit={handleSubmit}>
      <label htmlFor={textareaId} className="visually-hidden">
        Message the AI Knowledge Assistant
      </label>
      <textarea
        id={textareaId}
        className="chat-composer-input"
        placeholder="Ask anything..."
        value={value}
        maxLength={MAX_LENGTH}
        rows={1}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      {isStreaming ? (
        <Button type="button" variant="secondary" onClick={onStop} aria-label="Stop generating response">
          Stop
        </Button>
      ) : (
        <Button type="submit" disabled={!value.trim()} aria-label="Send message">
          Send
        </Button>
      )}
    </form>
  );
}
