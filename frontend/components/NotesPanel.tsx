"use client";
import { useState } from "react";
import { Trash2, Plus, StickyNote, Save } from "lucide-react";

interface Note {
  id: string;
  content: string;
  created_at: string;
}

interface Props {
  notes: Note[];
  onCreateNote: (content: string) => void;
  onDeleteNote: (id: string) => void;
}

export default function NotesPanel({ notes, onCreateNote, onDeleteNote }: Props) {
  const [isWriting, setIsWriting] = useState(false);
  const [newNote, setNewNote] = useState("");

  const handleSave = () => {
    if (newNote.trim()) {
      onCreateNote(newNote.trim());
      setNewNote("");
      setIsWriting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-100">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
              Notes
            </h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {notes.length}
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsWriting(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Note
        </button>
      </div>

      {/* New Note Input */}
      {isWriting && (
        <div className="p-3 border-b border-gray-100 bg-blue-50">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Write your note..."
            rows={4}
            className="w-full text-sm border border-blue-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                setIsWriting(false);
                setNewNote("");
              }}
              className="flex-1 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!newNote.trim()}
              className="flex-1 px-3 py-1.5 text-xs text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <Save className="w-3 h-3" />
              Save
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {notes.length === 0 && !isWriting ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <StickyNote className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No notes yet</p>
            <p className="text-xs text-gray-300 mt-1">
              Save AI responses or write your own
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="group p-3 bg-yellow-50 border border-yellow-100 rounded-xl hover:border-yellow-200 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-gray-700 leading-relaxed flex-1">
                  {note.content}
                </p>
                <button
                  onClick={() => onDeleteNote(note.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded-lg shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
              <p className="text-xs text-gray-300 mt-2">
                {new Date(note.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}