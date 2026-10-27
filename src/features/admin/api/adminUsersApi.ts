// Thin wrappers over the admin user-oversight REST endpoints (admin-dashboard-contract.md
// section 1). Read-only: this feature exists for support/oversight, not user management.
import { http } from "../../../lib/http";
import type { ApiSuccess } from "../../auth/types/auth.types";
import type { AdminConversationMessage, AdminUserConversationSummary, AdminUserSummary } from "../types/admin.types";

export async function listAdminUsers(): Promise<AdminUserSummary[]> {
  const { data } = await http.get<ApiSuccess<{ users: AdminUserSummary[] }>>("/admin/users");
  return data.data.users;
}

export async function listAdminUserConversations(userId: string): Promise<AdminUserConversationSummary[]> {
  const { data } = await http.get<ApiSuccess<{ conversations: AdminUserConversationSummary[] }>>(
    `/admin/users/${userId}/conversations`,
  );
  return data.data.conversations;
}

export async function getAdminUserConversationMessages(
  userId: string,
  conversationId: string,
): Promise<AdminConversationMessage[]> {
  const { data } = await http.get<ApiSuccess<{ messages: AdminConversationMessage[] }>>(
    `/admin/users/${userId}/conversations/${conversationId}/messages`,
  );
  return data.data.messages;
}
