'use client';

import { useEffect, useState } from 'react';
import { StickyNote, Plus, Edit2, Trash2, Save } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { PageTitle } from '@/components/ui/PageTitle';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/Feedback';
import { ConfirmModal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

interface Note {
  id: number;
  title: string;
  content: string;
  createdBy: number;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    const response = await fetch('/api/notes');
    if (response.ok) {
      const data = await response.json();
      setNotes(data.notes);
    }
  };

  const handleSave = async (note: Partial<Note>) => {
    if (note.id) {
      await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note),
      });
    } else {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note),
      });
    }
    setIsEditing(false);
    setShowNew(false);
    fetchNotes();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/notes?id=${id}`, { method: 'DELETE' });
    setSelectedNote(null);
    setPendingDelete(null);
    fetchNotes();
  };

  return (
    <AppShell>
      <PageTitle
        title="Shared Notes"
        description="Write things down together."
        action={
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4" />
            New note
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Notes list */}
        <div className="space-y-3 lg:col-span-1">
          {notes.length === 0 && (
            <Card className="p-6 text-center text-sm text-muted">
              No notes yet.
            </Card>
          )}
          {notes.map((note) => (
            <button
              key={note.id}
              onClick={() => {
                setSelectedNote(note);
                setIsEditing(false);
                setShowNew(false);
              }}
              className={cn(
                'w-full rounded-2xl border p-4 text-left transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
                selectedNote?.id === note.id
                  ? 'border-brand-300 bg-brand-50 shadow-card dark:border-brand-800 dark:bg-brand-900/25'
                  : 'border-default bg-surface shadow-soft hover:shadow-card'
              )}
            >
              <h3 className="truncate font-semibold text-fg">{note.title}</h3>
              <p className="mt-0.5 text-xs text-muted">by {note.creatorName}</p>
            </button>
          ))}
        </div>

        {/* Note view / edit */}
        <div className="lg:col-span-2">
          {showNew && (
            <NoteEditor onSave={handleSave} onCancel={() => setShowNew(false)} />
          )}

          {selectedNote &&
            !showNew &&
            (isEditing ? (
              <NoteEditor
                note={selectedNote}
                onSave={handleSave}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <Card className="p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-2xl font-bold tracking-tight text-fg">
                      {selectedNote.title}
                    </h2>
                    <p className="mt-0.5 text-sm text-muted">
                      by {selectedNote.creatorName}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => setIsEditing(true)}
                      aria-label="Edit note"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => setPendingDelete(selectedNote.id)}
                      aria-label="Delete note"
                      className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="whitespace-pre-wrap break-words leading-relaxed text-fg">
                  {selectedNote.content}
                </div>
              </Card>
            ))}

          {!selectedNote && !showNew && (
            <Card>
              <EmptyState
                icon={StickyNote}
                title="Nothing selected"
                description="Pick a note from the list, or create a new one."
                action={
                  <Button onClick={() => setShowNew(true)}>
                    <Plus className="h-4 w-4" />
                    New note
                  </Button>
                }
              />
            </Card>
          )}
        </div>
      </div>

      <ConfirmModal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete !== null && handleDelete(pendingDelete)}
        title="Delete this note?"
        description="This cannot be undone."
        confirmText="Delete"
        danger
      />
    </AppShell>
  );
}

function NoteEditor({
  note,
  onSave,
  onCancel,
}: {
  note?: Note;
  onSave: (note: Partial<Note>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ id: note?.id, title, content });
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit}>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-4 text-lg font-semibold"
          placeholder="Note title"
          required
        />
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={15}
          className="min-h-[18rem] resize-y"
          placeholder="Start typing…"
          required
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="submit">
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
