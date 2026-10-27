import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import { Alert } from "../components/Alert";
import { Spinner } from "../components/Spinner";
import {
  deleteDocument,
  listDocuments,
  reprocessDocument,
  uploadDocument,
} from "../features/documents/api/documentsApi";
import { normalizeApiError } from "../lib/http";
import type { DocumentStatus, KnowledgeDocument } from "../features/documents/types/documents.types";

// Client-side hint only — the backend is the authoritative gate on both extension and
// actual MIME type (see the contract's validation section).
const ACCEPTED_EXTENSIONS = ".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg";

const STATUS_LABEL: Record<DocumentStatus, string> = {
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
  disabled: "Disabled",
};

const STATUS_BADGE_CLASS: Record<DocumentStatus, string> = {
  processing: "badge-info",
  ready: "badge-success",
  failed: "badge-danger",
  disabled: "badge-muted",
};

interface UploadState {
  fileName: string;
  percent: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Document upload UI (Feature 4). Admins drag-and-drop or browse-select a file, it's
 * uploaded and processed (extracted/chunked/embedded) synchronously on the backend, and
 * the resulting document — with its final status — is shown in the list below. Citations
 * display is a later, separate pass; this page only manages the documents themselves.
 */
export function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setLoadError(null);
    listDocuments()
      .then(setDocuments)
      .catch((error: unknown) => setLoadError(normalizeApiError(error).message))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) {
      return;
    }

    setUploadError(null);
    setUploadState({ fileName: file.name, percent: 0 });
    try {
      const uploaded = await uploadDocument(file, {}, (percent) => {
        setUploadState({ fileName: file.name, percent });
      });
      setDocuments((prev) => [uploaded, ...prev]);
    } catch (error) {
      setUploadError(normalizeApiError(error).message);
    } finally {
      setUploadState(null);
    }
  }, []);

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    void handleFiles(event.target.files);
    // Reset so selecting the same file again still fires a change event.
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void handleFiles(event.dataTransfer.files);
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const confirmDelete = async (id: string) => {
    setBusyId(id);
    setRowError(null);
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (error) {
      setRowError(normalizeApiError(error).message);
    } finally {
      setBusyId(null);
      setPendingDeleteId(null);
    }
  };

  const handleReprocess = async (id: string) => {
    setBusyId(id);
    setRowError(null);
    try {
      const updated = await reprocessDocument(id);
      setDocuments((prev) => prev.map((doc) => (doc.id === updated.id ? updated : doc)));
    } catch (error) {
      setRowError(normalizeApiError(error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>Documents</h1>
        <Link to="/app/admin">Back to admin dashboard</Link>
      </header>

      <div className="admin-card">
        <h2 className="admin-card-title">Upload a document</h2>
        {uploadError ? <Alert message={uploadError} /> : null}

        <div
          className={`documents-dropzone${isDragging ? " documents-dropzone-active" : ""}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          aria-label="Drag and drop a document here, or use the browse files button"
        >
          <p className="documents-dropzone-text">Drag and drop a file here</p>
          <p className="documents-dropzone-hint">PDF, DOC, DOCX, TXT, PNG, JPG, or JPEG — up to 15 MB</p>
          <Button
            type="button"
            variant="secondary"
            disabled={uploadState !== null}
            onClick={() => fileInputRef.current?.click()}
          >
            Browse files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            className="visually-hidden"
            aria-label="Choose a document file to upload"
            disabled={uploadState !== null}
            onChange={onInputChange}
          />
        </div>

        {uploadState ? (
          <div className="documents-upload-progress" role="status" aria-live="polite">
            <span>
              Uploading {uploadState.fileName}… {uploadState.percent}%
            </span>
            <div className="documents-progress-track">
              <div className="documents-progress-fill" style={{ width: `${uploadState.percent}%` }} />
            </div>
          </div>
        ) : null}
      </div>

      <div className="admin-card">
        <div className="admin-card-toolbar">
          <h2 className="admin-card-title">Uploaded documents</h2>
        </div>

        {rowError ? <Alert message={rowError} /> : null}
        {loadError ? <Alert message={loadError} /> : null}
        {isLoading ? <Spinner label="Loading documents…" /> : null}

        {!isLoading && !loadError && documents.length === 0 ? (
          <p className="admin-empty">No documents uploaded yet. Upload one above to get started.</p>
        ) : null}

        {!isLoading && !loadError && documents.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Filename</th>
                  <th scope="col">Type</th>
                  <th scope="col">Size</th>
                  <th scope="col">Status</th>
                  <th scope="col">Uploaded</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const isBusy = busyId === doc.id;
                  const isPendingDelete = pendingDeleteId === doc.id;
                  return (
                    <tr key={doc.id}>
                      <td>
                        {doc.originalFilename}
                        {doc.status === "failed" && doc.processingError ? (
                          <p className="documents-row-error" role="alert">
                            {doc.processingError}
                          </p>
                        ) : null}
                      </td>
                      <td>{doc.sourceType}</td>
                      <td>{formatFileSize(doc.fileSize)}</td>
                      <td>
                        <span className={`badge ${STATUS_BADGE_CLASS[doc.status]}`}>{STATUS_LABEL[doc.status]}</span>
                      </td>
                      <td>{formatDate(doc.createdAt)}</td>
                      <td>
                        {isPendingDelete ? (
                          <div className="chat-history-confirm">
                            <span>Delete this document?</span>
                            <button
                              type="button"
                              className="chat-history-confirm-btn"
                              disabled={isBusy}
                              onClick={() => void confirmDelete(doc.id)}
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              className="chat-history-confirm-btn"
                              disabled={isBusy}
                              onClick={() => setPendingDeleteId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="admin-row-actions">
                            {doc.status === "failed" ? (
                              <Button variant="secondary" disabled={isBusy} onClick={() => void handleReprocess(doc.id)}>
                                Reprocess
                              </Button>
                            ) : null}
                            <Button
                              variant="ghost"
                              disabled={isBusy}
                              onClick={() => setPendingDeleteId(doc.id)}
                              aria-label={`Delete "${doc.originalFilename}"`}
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
