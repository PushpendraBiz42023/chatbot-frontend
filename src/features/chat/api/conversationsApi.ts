// Thin wrappers over the conversation persistence REST endpoints (Day 3 contract).
// Unlike `streamChat`, these are plain JSON request/response, so the shared
// axios instance (with its auth interceptor + silent-refresh) is the right tool.
import { http } from "../../../lib/http";
import type { ApiSuccess } from "../../auth/types/auth.types";
import type { AiProviderName, Conversation, MessageRecord } from "../types/chat.types";

export async function listConversations(): Promise<Conversation[]> {
  const { data } = await http.get<ApiSuccess<{ conversations: Conversation[] }>>("/conversations");
  return data.data.conversations;
}

export async function createConversation(): Promise<Conversation> {
  const { data } = await http.post<ApiSuccess<{ conversation: Conversation }>>("/conversations");
  return data.data.conversation;
}

export async function getConversation(id: string): Promise<Conversation> {
  const { data } = await http.get<ApiSuccess<{ conversation: Conversation }>>(`/conversations/${id}`);
  return data.data.conversation;
}

export async function getConversationMessages(id: string): Promise<MessageRecord[]> {
  const { data } = await http.get<ApiSuccess<{ messages: MessageRecord[] }>>(`/conversations/${id}/messages`);
  return data.data.messages;
}

export async function renameConversation(id: string, title: string): Promise<Conversation> {
  const { data } = await http.patch<ApiSuccess<{ conversation: Conversation }>>(`/conversations/${id}`, { title });
  return data.data.conversation;
}

export async function deleteConversation(id: string): Promise<void> {
  await http.delete<ApiSuccess<null>>(`/conversations/${id}`);
}

/**
 * Explicit provider switch (multi-provider-contract.md section 7) — a metadata-only write,
 * completely separate from the `/api/chat` flow. Messages/history are untouched; the server
 * validates `provider` against the fixed enum AND that it's currently configured, so a 400
 * VALIDATION_ERROR is expected/handled by the caller if an unconfigured choice is offered.
 */
export async function updateConversationProvider(id: string, provider: AiProviderName): Promise<Conversation> {
  const { data } = await http.patch<ApiSuccess<{ conversation: Conversation }>>(`/conversations/${id}/provider`, {
    provider,
  });
  return data.data.conversation;
}
