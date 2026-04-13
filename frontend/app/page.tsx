"use client";
import { useState, useEffect } from "react";
import { Plus, BookOpen } from "lucide-react";
import { toast } from "sonner";
import NotebookCard from "@/components/NotebookCard";
import CreateNotebookModal from "@/components/CreateNotebookModal";
import { getNotebooks, createNotebook, deleteNotebook } from "@/lib/api";

interface Notebook {
  id: string;
  title: string;
  created_at: string;
}

export default function Dashboard() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotebooks();
  }, []);

  const fetchNotebooks = async () => {
    try {
      const data = await getNotebooks();
      setNotebooks(data);
    } catch (error) {
      toast.error("Failed to fetch notebooks");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (title: string) => {
    try {
      const newNotebook = await createNotebook(title);
      setNotebooks((prev) => [newNotebook, ...prev]);
      toast.success("Notebook created successfully")
    } catch (error) {
      toast.error("Failed to create notebook");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotebook(id);
      setNotebooks((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notebook deleted")
    } catch (error) {
      toast.error("Failed to delete notebook");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-800">NotebookLM</h1>
              <p className="text-xs text-gray-400">AI Research Assistant</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Notebook
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800">My Notebooks</h2>
          <p className="text-sm text-gray-400 mt-1">
            {notebooks.length} notebook{notebooks.length !== 1 ? "s" : ""}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-100 rounded-full w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 mt-2" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-2 bg-gray-50 rounded full w-full" />
                  <div className="h-2 bg-gray-50 rounded full w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : notebooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-blue-50 p-4 rounded-2xl mb-4">
              <BookOpen className="w-10 h-10 text-blue-300" />
            </div>
            <h3 className="font-medium text-gray-600">No notebooks yet</h3>
            <p className="text-sm text-gray-400 mt-1 mb-4">
              Create your first notebook to get started
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              New Notebook
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notebooks.map((notebook) => (
              <NotebookCard
                key={notebook.id}
                {...notebook}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <CreateNotebookModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}