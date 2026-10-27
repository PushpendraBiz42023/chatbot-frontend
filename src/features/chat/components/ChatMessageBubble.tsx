import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { CopyButton } from "./CopyButton";
import type { ChatMessage } from "../types/chat.types";

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === "user";
  const isPending = message.status === "streaming" && message.content.length === 0;

  return (
    <div className={`chat-bubble-row ${isUser ? "chat-bubble-row-user" : "chat-bubble-row-assistant"}`}>
      <div className={`chat-bubble ${isUser ? "chat-bubble-user" : "chat-bubble-assistant"}`}>
        {isPending ? (
          <span className="chat-typing" aria-label="Assistant is typing" role="status">
            <span className="chat-typing-dot" />
            <span className="chat-typing-dot" />
            <span className="chat-typing-dot" />
          </span>
        ) : isUser ? (
          <p className="chat-bubble-text">{message.content}</p>
        ) : message.content ? (
          <div className="chat-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {message.content}
            </ReactMarkdown>
          </div>
        ) : null}

        {message.status === "error" ? (
          <p className="chat-bubble-error" role="alert">
            Something went wrong generating this response.
          </p>
        ) : null}

        {message.status === "stopped" ? (
          <p className="chat-bubble-note" role="status">
            {message.content ? "Generation stopped." : "Stopped before responding."}
          </p>
        ) : null}

        {!isUser && !isPending && message.content && (message.status === "done" || message.status === "stopped") ? (
          <div className="chat-bubble-actions">
            <CopyButton text={message.content} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
