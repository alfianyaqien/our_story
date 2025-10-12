'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StickyNote, Plus, Edit2, Trash2, Save } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

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
    if (confirm('Delete this note?')) {
      await fetch(`/api/notes?id=${id}`, { method: 'DELETE' });
      setSelectedNote(null);
      fetchNotes();
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-love-ice via-white to-love-lavender dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <PageHeader title="Shared Notes" />
        </div>
        
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition shadow-md"
          >
            <Plus size={20} />
            New Note
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Notes List */}
          <div className="md:col-span-1 space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => { setSelectedNote(note); setIsEditing(false); }}
                className={`p-4 rounded-lg cursor-pointer transition ${
                  selectedNote?.id === note.id
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 shadow-lg border-2 border-yellow-300 dark:border-yellow-700'
                    : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 shadow hover:shadow-md'
                }`}
              >
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{note.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">by {note.creatorName}</p>
              </div>
            ))}
          </div>

          {/* Note View/Edit */}
          <div className="md:col-span-2">
            {showNew && (
              <NoteEditor
                onSave={handleSave}
                onCancel={() => setShowNew(false)}
              />
            )}
            {selectedNote && !showNew && (
              isEditing ? (
                <NoteEditor
                  note={selectedNote}
                  onSave={handleSave}
                  onCancel={() => setIsEditing(false)}
                />
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{selectedNote.title}</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">by {selectedNote.creatorName}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/40 transition"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(selectedNote.id)}
                        className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800/40 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{selectedNote.content}</div>
                  </div>
                </div>
              )
            )}
            {!selectedNote && !showNew && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                <StickyNote className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                <p className="text-gray-500 dark:text-gray-400">Select a note or create a new one</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NoteEditor({ note, onSave, onCancel }: { note?: Note; onSave: (note: Partial<Note>) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ id: note?.id, title, content });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full text-2xl font-bold mb-4 px-4 py-2 border-b-2 border-gray-200 dark:border-gray-600 focus:border-yellow-500 dark:focus:border-yellow-500 outline-none bg-transparent dark:text-gray-100"
        placeholder="Note Title"
        required
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={15}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none resize-none"
        placeholder="Start typing..."
        required
      />
      <div className="flex gap-3 mt-4">
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
        >
          <Save size={18} />
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
