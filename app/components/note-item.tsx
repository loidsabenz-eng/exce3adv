export interface Note {
  id: string;
  title: string;
  description: string;
  createdAt?: string;
}

interface NoteItemProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
}

export default function NoteItem({ note, onEdit, onDelete }: NoteItemProps) {
  const createdAt = note.createdAt ? new Date(note.createdAt) : null;
  const hasValidDate = createdAt !== null && Number.isFinite(createdAt.getTime());
  const createdAtLabel = hasValidDate
    ? createdAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "Date not recorded";

  return (
    <article className="note-item">
      <div className="note-copy">
        <h3>{note.title}</h3>
        <p className="note-time">
          <time
            dateTime={hasValidDate ? note.createdAt : undefined}
            suppressHydrationWarning
          >
            {createdAtLabel}
          </time>
        </p>
        <p>{note.description}</p>
      </div>
      <div className="note-actions">
        <button
          className="text-button"
          type="button"
          onClick={() => onEdit(note)}
          aria-label={`Edit ${note.title}`}
        >
          Edit
        </button>
        <button
          className="text-button delete-button"
          type="button"
          onClick={() => onDelete(note.id)}
          aria-label={`Delete ${note.title}`}
        >
          Delete
        </button>
      </div>
    </article>
  );
}