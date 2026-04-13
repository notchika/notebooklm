"use client";
import { useState, useRef } from "react";
import { X, Link, Upload, FileText, File, Loader2 } from "lucide-react";

type SourceType = "url" | "file" | "youtube";

interface Props {
  onClose: () => void;
  onAddUrl: (url: string) => void;
  onAddFile: (file: File) => void;
  isLoading: boolean;
}

export default function AddSourceModal({
  onClose,
  onAddUrl,
  onAddFile,
  isLoading,
}: Props) {
  const [sourceType, setSourceType] = useState<SourceType>("url");
  const [url, setUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (sourceType === "url" || sourceType === "youtube") {
      if (url.trim()) onAddUrl(url.trim());
    } else if (sourceType === "file" && selectedFile) {
      onAddFile(selectedFile);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <File className="w-4 h-4 text-red-500" />;
    if (ext === "docx" || ext === "doc")
      return <FileText className="w-4 h-4 text-blue-500" />;
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  const tabs: { type: SourceType; label: string; icon: React.ReactNode }[] = [
    { type: "url", label: "Website", icon: <Link className="w-3.5 h-3.5" /> },
    { type: "youtube", label: "YouTube", icon: <span className="text-xs font-bold">YT</span> },
    { type: "file", label: "File", icon: <Upload className="w-3.5 h-3.5" /> },
  ];

  const canSubmit =
    !isLoading &&
    ((sourceType !== "file" && url.trim()) ||
      (sourceType === "file" && selectedFile));

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Add Source</h2>
          {!isLoading && (
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                Processing Source
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Scraping, chunking and embedding content...
              </p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-blue-600 h-1.5 rounded-full animate-pulse w-3/4" />
            </div>
            <p className="text-xs text-gray-300">
              This may take up to 60 seconds
            </p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.type}
                  onClick={() => {
                    setSourceType(tab.type);
                    setUrl("");
                    setSelectedFile(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    sourceType === tab.type
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* URL / YouTube Input */}
            {(sourceType === "url" || sourceType === "youtube") && (
              <>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500">
                  {sourceType === "youtube" ? (
                    <span className="w-4 h-4 text-red-500 shrink-0" />
                  ) : (
                    <Link className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                  <input
                    type="url"
                    placeholder={
                      sourceType === "youtube"
                        ? "Paste a YouTube URL..."
                        : "Paste a website URL..."
                    }
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    className="flex-1 text-sm outline-none"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2 ml-1">
                  {sourceType === "youtube"
                    ? "YouTube video transcript will be extracted automatically"
                    : "Any publicly accessible webpage will work"}
                </p>
              </>
            )}

            {/* File Upload */}
            {sourceType === "file" && (
              <>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? "border-blue-400 bg-blue-50"
                      : selectedFile
                      ? "border-green-300 bg-green-50"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  }`}
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2">
                      {getFileIcon(selectedFile.name)}
                      <span className="text-sm font-medium text-gray-700 truncate max-w-48">
                        {selectedFile.name}
                      </span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        Drop a file here or{" "}
                        <span className="text-blue-500">browse</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PDF, DOCX, TXT supported
                      </p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Source
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}