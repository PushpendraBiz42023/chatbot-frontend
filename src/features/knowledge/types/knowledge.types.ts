// Types mirroring the backend admin knowledge API contract exactly.
// See: admin-knowledge-contract.md.

export type KnowledgeStatus = "active" | "disabled";

export interface KnowledgeEntry {
  id: string;
  title: string;
  category: string | null;
  tags: string | null;
  content: string;
  status: KnowledgeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeEntryRequest {
  title: string;
  category?: string;
  tags?: string;
  content: string;
  status?: KnowledgeStatus;
}

export interface UpdateKnowledgeEntryRequest {
  title?: string;
  category?: string;
  tags?: string;
  content?: string;
  status?: KnowledgeStatus;
}
