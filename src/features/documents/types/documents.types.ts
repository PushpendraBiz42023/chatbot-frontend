// Types mirroring the backend admin document upload API contract exactly.
// See: document-upload-contract.md.

export type DocumentSourceType = "pdf" | "doc" | "docx" | "txt" | "image";

export type DocumentStatus = "processing" | "ready" | "failed" | "disabled";

export interface KnowledgeDocument {
  id: string;
  title: string;
  description: string | null;
  sourceType: DocumentSourceType;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  status: DocumentStatus;
  processingError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UploadDocumentOptions {
  title?: string;
  description?: string;
}
