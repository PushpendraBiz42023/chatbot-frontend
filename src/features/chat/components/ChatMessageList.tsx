import { useEffect, useRef } from "react";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatEmptyState } from "./ChatEmptyState";
import type { ChatMessage } from "../types/chat.types";

interface ChatMessageListProps {
  messages: ChatMessage[];
}

export function ChatMessageList({ messages }: ChatMessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  if (messages.length === 0) {
    return <ChatEmptyState />;
  }

  return (
    <div className="chat-message-list" role="log" aria-live="polite" aria-relevant="additions">
      {messages.map((message) => (
        <ChatMessageBubble key={message.id} message={message} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
