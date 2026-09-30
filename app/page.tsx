"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import NoteItem, { type Note } from "./components/note-item";

const STORAGE_KEY = "fieldnotes";

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titleError, setTitleError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [deletedNote, setDeletedNote] = useState<{ note: Note; index: number } | null>(null);
  const [isReady, setIsReady] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const normalizedTitle = title.trim().toLocaleLowerCase();
  const hasDuplicateTitle = normalizedTitle.length > 0 && notes.some(
    (note) =>
      note.id !== editingId &&
      note.title.trim().toLocaleLowerCase() === normalizedTitle,
  );

  useEffect(() => {
    let isActive = true;

    void Promise.resolve().then(() => {
      if (!isActive) return;

      try {
        const storedNotes = window.localStorage.getItem(STORAGE_KEY);
        if (storedNotes) {
          setNotes(JSON.parse(storedNotes) as Note[]);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsReady(true);
      }

    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (isReady) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }
  }, [isReady, notes]);

  useEffect(() => {
    const titleExists = notes.some(
      (note) =>
        note.id !== editingId &&
        note.title.trim().toLocaleLowerCase() === normalizedTitle,
    );
    titleInputRef.current?.setCustomValidity(
      titleExists ? "A note with this title already exists." : "",
    );
  }, [editingId, normalizedTitle, notes]);

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    };
  }, []);

  function resetForm() {
    setTitle("");
    setDescription("");
    setEditingId(null);
    setTitleError("");
    setDescriptionError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    setTitleError(cleanTitle ? "" : "A title is required.");
    setDescriptionError(cleanDescription ? "" : "A description is required.");
    const duplicate = notes.some(
      (note) =>
        note.id !== editingId &&
        note.title.trim().toLocaleLowerCase() === cleanTitle.toLocaleLowerCase(),
    );

    if (!cleanTitle || !cleanDescription || duplicate) return;

    if (editingId) {
      setNotes((currentNotes) =>
        currentNotes.map((note) =>
          note.id === editingId
            ? { ...note, title: cleanTitle, description: cleanDescription }
            : note,
        ),
      );
    } else {
      setNotes((currentNotes) => [
        {
          id: crypto.randomUUID(),
          title: cleanTitle,
          description: cleanDescription,
          createdAt: new Date().toISOString(),
        },
        ...currentNotes,
      ]);
    }

    resetForm();
  }

  function handleEdit(note: Note) {
    setTitle(note.title);
    setDescription(note.description);
    setEditingId(note.id);
  }

  function handleDelete(id: string) {
    const index = notes.findIndex((note) => note.id === id);
    const note = notes[index];
    if (!note) return;

    setNotes((currentNotes) => currentNotes.filter((note) => note.id !== id));
    if (editingId === id) resetForm();
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    setDeletedNote({ note, index });
    deleteTimerRef.current = setTimeout(() => {
      setDeletedNote(null);
      deleteTimerRef.current = null;
    }, 5000);
  }

  function handleUndoDelete() {
    if (!deletedNote) return;
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    setNotes((currentNotes) => {
      if (currentNotes.some((note) => note.id === deletedNote.note.id)) return currentNotes;
      const restoredNotes = [...currentNotes];
      restoredNotes.splice(deletedNote.index, 0, deletedNote.note);
      return restoredNotes;
    });
    setDeletedNote(null);
    deleteTimerRef.current = null;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Fieldnotes home">
          <span className="brand-mark" aria-hidden="true">F</span>
          <span>fieldnotes</span>
        </a>
        <span className="topbar-label">A place for the things worth keeping</span>
      </header>

      <section className="intro" id="top">
        <div>
          <p className="eyebrow">YOUR PERSONAL NOTEBOOK</p>
          <h1>Thoughts, <span>kept close.</span></h1>
        </div>
        <p className="intro-count">
          <strong>{notes.length.toString().padStart(2, "0")}</strong>
          <span>{notes.length === 1 ? "note saved" : "notes saved"}</span>
        </p>
      </section>

      <div className="workspace">
        <section className="composer" aria-labelledby="form-heading">
          <div className="section-heading">
            <span className="section-index">01</span>
            <h2 id="form-heading">{editingId ? "Edit note" : "New note"}</h2>
          </div>

          <form className="note-form" onSubmit={handleSubmit}>
            <label htmlFor="note-title">Title</label>
            <input
              id="note-title"
              ref={titleInputRef}
              name="title"
              placeholder="Give this thought a name"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setTitleError("");
              }}
              maxLength={80}
              aria-invalid={Boolean(titleError || hasDuplicateTitle)}
              aria-describedby={titleError || hasDuplicateTitle ? "title-error" : undefined}
              required
            />
            {(titleError || hasDuplicateTitle) && (
              <p className="field-message" id="title-error" role="alert">
                {titleError || "A note with this title already exists."}
              </p>
            )}

            <label htmlFor="note-description">Description</label>
            <textarea
              id="note-description"
              name="description"
              placeholder="Write a few details..."
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setDescriptionError("");
              }}
              rows={7}
              maxLength={2000}
              aria-invalid={Boolean(descriptionError)}
              aria-describedby={descriptionError ? "description-error" : undefined}
              required
            />
            {descriptionError && (
              <p className="field-message" id="description-error" role="alert">
                {descriptionError}
              </p>
            )}

            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={hasDuplicateTitle}>
                {editingId ? "Save changes" : "Add note"}
              </button>
              {editingId && (
                <button className="text-button" type="button" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
          <p className="privacy-note">Your notes stay in this browser.</p>
        </section>

        <section className="notes-section" aria-labelledby="notes-heading">
          <div className="section-heading notes-heading">
            <span className="section-index">02</span>
            <h2 id="notes-heading">All notes</h2>
            {notes.length > 0 && <span className="notes-total">{notes.length}</span>}
          </div>

          {!isReady ? (
            <p className="empty-state">Opening your notebook...</p>
          ) : notes.length === 0 ? (
            <div className="empty-state">
              <span className="empty-mark" aria-hidden="true">+</span>
              <h3>A fresh page</h3>
              <p>Your notes will appear here.</p>
            </div>
          ) : (
            <div className="note-list">
              {notes.map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {deletedNote && (
        <div className="undo-toast" role="status" aria-live="polite">
          <span><strong>{deletedNote.note.title}</strong> deleted.</span>
          <button className="text-button" type="button" onClick={handleUndoDelete}>
            Undo
          </button>
        </div>
      )}

      <footer className="page-footer">
        <span>FIELDNOTES</span>
        <span>Keep what matters.</span>
      </footer>
    </main>
  );
}