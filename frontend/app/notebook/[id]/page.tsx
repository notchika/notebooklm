"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, StickyNote, Mic } from "lucide-react";
import SourcePanel from "@/components/SourcePanel";
import ChatPanel from "@/components/ChatPanel";
import AddSourceModal from "@/components/AddSourceModal";
import NotesPanel from "@/components/NotesPanel";
import { toast } from "sonner";
import {getSources, addUrlSource, addFileSource, sendMessage, getNotebook, getNotes, createNote, deleteNote } from "@/lib/api";
import AudioOverview from "@/components/AudioOverview";
import { generateAudioScript } from "@/lib/api";

interface Source {
  id: string;
  title: string;
  url: string;
  summary?: string;
  created_at: string;
}

interface Note {
  id: string;
  content: string;
  created_at: string;
}

export default function NotebookPage() {
  const { id } = useParams();
  const router = useRouter();
  const [sources, setSources] = useState<Source[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [showAddSource, setShowAddSource] = useState(false);
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [notebookTitle, setNotebookTitle] = useState("Notebook");
  const [showNotes, setShowNotes] = useState(false);
  const [showAudio, setShowAudio] = useState(false);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [sourcesData, notebookData, notesData] = await Promise.all([
        getSources(id as string),
        getNotebook(id as string),
        getNotes(id as string),
      ]);
      setSources(sourcesData);
      setNotebookTitle(notebookData.title);
      setNotes(notesData);
    } catch (error) {
      toast.error("Failed to load notebook data");
    } finally {
      setIsPageLoading(false);
    }
  };

  const handleAddSource = async (url: string) => {
    setIsAddingSource(true);
    try {
      await addUrlSource(id as string, url);
      await fetchData();
      setShowAddSource(false);
      toast.success("Source added successfully!");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail ||
          "Failed to add source — site may be blocking scrapers"
      );
    } finally {
      setIsAddingSource(false);
    }
  };

  const handleAddFile = async (file: File) => {
  setIsAddingSource(true);
  try {
    await addFileSource(id as string, file);
    await fetchData();
    setShowAddSource(false);
    toast.success("File added successfully!");
  } catch (error: any) {
    toast.error(
      error?.response?.data?.detail || "Failed to process file"
    );
  } finally {
    setIsAddingSource(false);
   }
  };

  const handleSendMessage = async (message: string): Promise<{content: string, sources: string[]}> => {
  try {
    const data = await sendMessage(id as string, message);
    return {
      content: data.response,
      sources: data.sources_used || []
    };
  } catch (error) {
    toast.error("Failed to get a response — please try again");
    throw error;
  }
  };

  const handleCreateNote = async (content: string) => {
    try {
      const newNote = await createNote(id as string, content);
      setNotes((prev) => [newNote, ...prev]);
      toast.success("Note saved!");
    } catch (error) {
      toast.error("Failed to save note");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(id as string, noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success("Note deleted");
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  const handleGenerateAudio = async () => {
    return await generateAudioScript(id as string);
  }

  if (isPageLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl">
            <BookOpen className="w-7 h-7 text-white animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">
              Loading notebook...
            </p>
            <p className="text-xs text-gray-400 mt-1">Fetching your sources</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shrink-0">
        <div className="px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-semibold text-gray-800">{notebookTitle}</h1>
          </div>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
            {sources.length} source{sources.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`ml-auto flex items-center gap-2 px-3 py-1.5 text-sm rounded-xl transition-colors ${
              showNotes
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            <StickyNote className="w-4 h-4" />
            Notes {notes.length > 0 && `(${notes.length})`}
          </button>
          <button 
            onClick={() => setShowAudio(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-xl transition-colors bg-gray-100 text-gray-500 hover:bg-gray-200"
          >
            <Mic className="w-4 h-4" />
            Audio
          </button>
        </div>
      </header>

      {/* Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left — Sources Panel */}
        <div className="w-80 shrink-0 overflow-hidden">
          <SourcePanel
            sources={sources}
            onAddSource={() => setShowAddSource(true)}
          />
        </div>

        {/* Divider */}
        <div className="w-px bg-gray-100 shrink-0" />

        {/* Middle — Chat Panel */}
        <div className="flex-1 overflow-hidden">
          <ChatPanel
            notebookId={id as string}
            onSendMessage={handleSendMessage}
            onSaveNote={handleCreateNote}
          />
        </div>

        {/* Right — Notes Panel (only when open) */}
        {showNotes && (
          <>
            <div className="w-px bg-gray-100 shrink-0" />
            <div className="w-72 shrink-0 overflow-hidden">
              <NotesPanel
                notes={notes}
                onCreateNote={handleCreateNote}
                onDeleteNote={handleDeleteNote}
              />
            </div>
          </>
        )}
      </div>

      {showAddSource && (
        <AddSourceModal
          onClose={() => setShowAddSource(false)}
          onAddUrl={handleAddSource}
          onAddFile={handleAddFile}
          isLoading={isAddingSource}
        />
      )}

      {showAudio && (
        <AudioOverview
          notebookId={id as string}
          notebookTitle={notebookTitle}
          onClose={() => setShowAudio(false)}
          onGenerate={handleGenerateAudio}
        />
      )}
    </div>
  );
}