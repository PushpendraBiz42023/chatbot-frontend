// Thin wrappers over the admin-only document upload REST endpoints (Feature 4 contract).
import type { AxiosProgressEvent } from "axios";
import { http } from "../../../lib/http";
import type { ApiSuccess } from "../../auth/types/auth.types";
import type { KnowledgeDocument, UploadDocumentOptions } from "../types/documents.types";

// Processing (extract + chunk + embed) happens synchronously inline on the backend and can
// take several seconds for a larger PDF or an image needing a Gemini call — the default
// shared `http` timeout is too short for this one call, so it's overridden here only.
const UPLOAD_TIMEOUT_MS = 60_000;

export async function listDocuments(): Promise<KnowledgeDocument[]> {
  const { data } = await http.get<ApiSuccess<{ documents: KnowledgeDocument[] }>>("/admin/documents");
  return data.data.documents;
}

export async function getDocument(id: string): Promise<KnowledgeDocument> {
  const { data } = await http.get<ApiSuccess<{ document: KnowledgeDocument }>>(`/admin/documents/${id}`);
  return data.data.document;
}

export async function uploadDocument(
  file: File,
  options: UploadDocumentOptions = {},
  onProgress?: (percent: number) => void,
): Promise<KnowledgeDocument> {
  const formData = new FormData();
  formData.append("file", file);
  if (options.title?.trim()) {
    formData.append("title", options.title.trim());
  }
  if (options.description?.trim()) {
    formData.append("description", options.description.trim());
  }

  const { data } = await http.post<ApiSuccess<{ document: KnowledgeDocument }>>("/admin/documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: UPLOAD_TIMEOUT_MS,
    onUploadProgress: (event: AxiosProgressEvent) => {
      if (!onProgress || !event.total) {
        return;
      }
      onProgress(Math.round((event.loaded / event.total) * 100));
    },
  });
  return data.data.document;
}

export async function deleteDocument(id: string): Promise<void> {
  await http.delete<ApiSuccess<null>>(`/admin/documents/${id}`);
}

export async function reprocessDocument(id: string): Promise<KnowledgeDocument> {
  const { data } = await http.post<ApiSuccess<{ document: KnowledgeDocument }>>(`/admin/documents/${id}/reprocess`);
  return data.data.document;
}
