"use client";
import {
  Globe,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

interface Source {
  id: string;
  title: string;
  url: string;
  summary?: string;
  created_at: string;
}

interface Props {
  sources: Source[];
  onAddSource: () => void;
}

function SourceCard({ source }: { source: Source }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50 group transition-colors border border-transparent hover:border-blue-100">
      <div className="bg-blue-50 p-1.5 rounded-lg shrink-0 mt-0.5 group-hover:bg-blue-100 transition-colors">
        <Globe className="w-3.5 h-3.5 text-blue-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700 truncate leading-snug">
          {source.title}
        </p>
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-600 hover:underline truncate block mt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          {source.url ? new URL(source.url).hostname : "Uploaded File"}
        </a>
        {source.summary && (
          <div className="mt-1.5">
            <p
              className={`text-xs text-gray-400 leading-relaxed ${
                expanded ? "" : "line-clamp-2"
              }`}
            >
              {source.summary}
            </p>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-0.5 text-xs text-blue-400 hover:text-blue-600 mt-1 transition-colors"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Read more
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SourcePanel({ sources, onAddSource }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="h-full flex flex-col items-center py-4 bg-white border-r border-gray-100 w-12">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          title="Expand sources"
        >
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
        <div className="mt-4 flex flex-col items-center gap-2">
          {sources.map((_, i) => (
            <div key={i} className="w-2 h-2 bg-blue-300 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-100">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
              Sources
            </h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {sources.length}
            </span>
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="Collapse sources"
          >
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <button
          onClick={onAddSource}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Source
        </button>
      </div>

      {/* Sources List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Globe className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No sources yet</p>
            <p className="text-xs text-gray-300 mt-1">
              Add a URL to get started
            </p>
          </div>
        ) : (
          sources.map((source) => (
            <SourceCard key={source.id} source={source} />
          ))
        )}
      </div>
    </div>
  );
}