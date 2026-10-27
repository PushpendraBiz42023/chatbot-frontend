// Types mirroring the new admin oversight API contract exactly (admin-dashboard-contract.md):
// GET /api/admin/stats, GET /api/admin/users, GET /api/admin/users/:userId/conversations,
// GET /api/admin/users/:userId/conversations/:conversationId/messages.
import type { UserRole } from "../../auth/types/auth.types";
import type { AiProviderName, MessageRecord, ProviderRuntimeStatus } from "../../chat/types/chat.types";

export interface AdminStats {
  totalUsers: number;
  totalConversations: number;
  totalKnowledgeEntries: number;
  totalDocuments: number;
}

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
  conversationCount: number;
}

export interface AdminUserConversationSummary {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export type AdminConversationMessage = MessageRecord;

// ---- Multi-provider oversight (multi-provider-contract.md section 6/9): GET /api/admin/providers/status,
// GET /api/admin/providers/usage. Admin-only — never renders an API key or config value beyond the model name.

export interface AdminProviderStatus {
  provider: AiProviderName;
  model: string;
  configured: boolean;
  status: ProviderRuntimeStatus;
  /** Sanitized message only — never a raw stack trace or API key. Null when there's no error on record. */
  lastError: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
}

export interface AdminProviderUsage {
  provider: AiProviderName;
  model: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitErrors: number;
  quotaErrors: number;
  timeouts: number;
  serverErrors: number;
  otherErrors: number;
  totalInputTokens: number | null;
  totalOutputTokens: number | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
}
