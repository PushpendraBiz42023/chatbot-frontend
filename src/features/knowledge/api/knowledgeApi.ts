// Thin wrappers over the admin-only knowledge REST endpoints (Feature 2A contract).
import { http } from "../../../lib/http";
import type { ApiSuccess } from "../../auth/types/auth.types";
import type { CreateKnowledgeEntryRequest, KnowledgeEntry, UpdateKnowledgeEntryRequest } from "../types/knowledge.types";

export async function listKnowledgeEntries(): Promise<KnowledgeEntry[]> {
  const { data } = await http.get<ApiSuccess<{ entries: KnowledgeEntry[] }>>("/admin/knowledge");
  return data.data.entries;
}

export async function getKnowledgeEntry(id: string): Promise<KnowledgeEntry> {
  const { data } = await http.get<ApiSuccess<{ entry: KnowledgeEntry }>>(`/admin/knowledge/${id}`);
  return data.data.entry;
}

export async function createKnowledgeEntry(payload: CreateKnowledgeEntryRequest): Promise<KnowledgeEntry> {
  const { data } = await http.post<ApiSuccess<{ entry: KnowledgeEntry }>>("/admin/knowledge", payload);
  return data.data.entry;
}

export async function updateKnowledgeEntry(id: string, payload: UpdateKnowledgeEntryRequest): Promise<KnowledgeEntry> {
  const { data } = await http.patch<ApiSuccess<{ entry: KnowledgeEntry }>>(`/admin/knowledge/${id}`, payload);
  return data.data.entry;
}

export async function deleteKnowledgeEntry(id: string): Promise<void> {
  await http.delete<ApiSuccess<null>>(`/admin/knowledge/${id}`);
}
