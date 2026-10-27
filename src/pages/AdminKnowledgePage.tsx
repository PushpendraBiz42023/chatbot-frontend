import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import { Alert } from "../components/Alert";
import { Spinner } from "../components/Spinner";
import { TextInput } from "../components/TextInput";
import {
  createKnowledgeEntry,
  deleteKnowledgeEntry,
  listKnowledgeEntries,
  updateKnowledgeEntry,
} from "../features/knowledge/api/knowledgeApi";
import { normalizeApiError } from "../lib/http";
import type { KnowledgeEntry, KnowledgeStatus } from "../features/knowledge/types/knowledge.types";

type ViewMode = "list" | "create" | { edit: KnowledgeEntry };

interface FormValues {
  title: string;
  category: string;
  tags: string;
  content: string;
  status: KnowledgeStatus;
}

interface FormErrors {
  title?: string;
  content?: string;
}

const EMPTY_FORM: FormValues = { title: "", category: "", tags: "", content: "", status: "active" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  const title = values.title.trim();
  if (!title) {
    errors.title = "Title is required.";
  } else if (title.length > 200) {
    errors.title = "Title must be 200 characters or fewer.";
  }

  const content = values.content.trim();
  if (!content) {
    errors.content = "Content is required.";
  } else if (content.length > 50_000) {
    errors.content = "Content must be 50,000 characters or fewer.";
  }

  return errors;
}

/**
 * Manual knowledge management (Feature 2A). List + create/edit toggle on one page,
 * per the contract — no separate route per entry needed for this MVP. This only
 * stores knowledge records; nothing in chat reads them yet.
 */
export function AdminKnowledgePage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [view, setView] = useState<ViewMode>("list");
  const [formValues, setFormValues] = useState<FormValues>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setLoadError(null);
    listKnowledgeEntries()
      .then(setEntries)
      .catch((error: unknown) => setLoadError(normalizeApiError(error).message))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const openCreate = () => {
    setFormValues(EMPTY_FORM);
    setFormErrors({});
    setSubmitError(null);
    setView("create");
  };

  const openEdit = (entry: KnowledgeEntry) => {
    setFormValues({
      title: entry.title,
      category: entry.category ?? "",
      tags: entry.tags ?? "",
      content: entry.content,
      status: entry.status,
    });
    setFormErrors({});
    setSubmitError(null);
    setView({ edit: entry });
  };

  const backToList = () => {
    setView("list");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validate(formValues);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        title: formValues.title.trim(),
        category: formValues.category.trim() || undefined,
        tags: formValues.tags.trim() || undefined,
        content: formValues.content.trim(),
        status: formValues.status,
      };

      if (typeof view === "object" && "edit" in view) {
        const updated = await updateKnowledgeEntry(view.edit.id, payload);
        setEntries((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
      } else {
        const created = await createKnowledgeEntry(payload);
        setEntries((prev) => [created, ...prev]);
      }
      setView("list");
    } catch (error) {
      setSubmitError(normalizeApiError(error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (entry: KnowledgeEntry) => {
    const nextStatus: KnowledgeStatus = entry.status === "active" ? "disabled" : "active";
    setBusyId(entry.id);
    setRowError(null);
    try {
      const updated = await updateKnowledgeEntry(entry.id, { status: nextStatus });
      setEntries((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (error) {
      setRowError(normalizeApiError(error).message);
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async (id: string) => {
    setBusyId(id);
    setRowError(null);
    try {
      await deleteKnowledgeEntry(id);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch (error) {
      setRowError(normalizeApiError(error).message);
    } finally {
      setBusyId(null);
      setPendingDeleteId(null);
    }
  };

  const isEditing = typeof view === "object" && "edit" in view;

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>Knowledge base</h1>
        <Link to="/app/admin">Back to admin dashboard</Link>
      </header>

      {view === "list" ? (
        <div className="admin-card">
          <div className="admin-card-toolbar">
            <h2 className="admin-card-title">Entries</h2>
            <Button onClick={openCreate}>+ New entry</Button>
          </div>

          {rowError ? <Alert message={rowError} /> : null}
          {loadError ? <Alert message={loadError} /> : null}
          {isLoading ? <Spinner label="Loading knowledge entries…" /> : null}

          {!isLoading && !loadError && entries.length === 0 ? (
            <p className="admin-empty">No knowledge entries yet. Create one to get started.</p>
          ) : null}

          {!isLoading && !loadError && entries.length > 0 ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Title</th>
                    <th scope="col">Status</th>
                    <th scope="col">Updated</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const isBusy = busyId === entry.id;
                    const isPendingDelete = pendingDeleteId === entry.id;
                    return (
                      <tr key={entry.id}>
                        <td>{entry.title}</td>
                        <td>
                          <span className={`badge badge-${entry.status === "active" ? "success" : "muted"}`}>
                            {entry.status}
                          </span>
                        </td>
                        <td>{formatDate(entry.updatedAt)}</td>
                        <td>
                          {isPendingDelete ? (
                            <div className="chat-history-confirm">
                              <span>Delete this entry?</span>
                              <button
                                type="button"
                                className="chat-history-confirm-btn"
                                disabled={isBusy}
                                onClick={() => void confirmDelete(entry.id)}
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
                              <Button variant="secondary" disabled={isBusy} onClick={() => void toggleStatus(entry)}>
                                {entry.status === "active" ? "Disable" : "Enable"}
                              </Button>
                              <Button variant="secondary" disabled={isBusy} onClick={() => openEdit(entry)}>
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                disabled={isBusy}
                                onClick={() => setPendingDeleteId(entry.id)}
                                aria-label={`Delete "${entry.title}"`}
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
      ) : (
        <div className="admin-card">
          <h2 className="admin-card-title">{isEditing ? "Edit entry" : "New entry"}</h2>
          {submitError ? <Alert message={submitError} /> : null}
          <form className="admin-form" onSubmit={handleSubmit} noValidate>
            <TextInput
              label="Title"
              value={formValues.title}
              maxLength={200}
              disabled={isSubmitting}
              error={formErrors.title}
              onChange={(event) => setFormValues((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
            <TextInput
              label="Category"
              value={formValues.category}
              maxLength={100}
              disabled={isSubmitting}
              onChange={(event) => setFormValues((prev) => ({ ...prev, category: event.target.value }))}
            />
            <TextInput
              label="Tags (comma-separated)"
              value={formValues.tags}
              maxLength={500}
              disabled={isSubmitting}
              onChange={(event) => setFormValues((prev) => ({ ...prev, tags: event.target.value }))}
            />

            <div className="field">
              <label htmlFor="knowledge-content" className="field-label">
                Content
              </label>
              <textarea
                id="knowledge-content"
                className="text-input admin-textarea"
                rows={10}
                maxLength={50_000}
                value={formValues.content}
                disabled={isSubmitting}
                aria-invalid={formErrors.content ? true : undefined}
                aria-describedby={formErrors.content ? "knowledge-content-error" : undefined}
                onChange={(event) => setFormValues((prev) => ({ ...prev, content: event.target.value }))}
                required
              />
              {formErrors.content ? (
                <p id="knowledge-content-error" className="field-error" role="alert">
                  {formErrors.content}
                </p>
              ) : null}
            </div>

            <div className="field">
              <label htmlFor="knowledge-status" className="field-label">
                Status
              </label>
              <select
                id="knowledge-status"
                className="text-input"
                value={formValues.status}
                disabled={isSubmitting}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, status: event.target.value as KnowledgeStatus }))
                }
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>

            <div className="admin-form-actions">
              <Button type="submit" isLoading={isSubmitting}>
                Save
              </Button>
              <Button type="button" variant="secondary" disabled={isSubmitting} onClick={backToList}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
