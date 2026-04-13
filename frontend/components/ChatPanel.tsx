"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, StickyNote } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

interface Props {
  notebookId: string;
  onSendMessage: (message: string) => Promise<{content: string, sources: string[]}>;
  onSaveNote: (content: string) => void;
}

export default function ChatPanel({ notebookId, onSendMessage, onSaveNote }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const response = await onSendMessage(userMessage);
      setMessages((prev) => [...prev, { role: "assistant", content: response.content, sources: response.sources }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-white">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
          Chat
        </h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Bot className="w-12 h-12 text-blue-200 mb-3" />
            <p className="text-sm font-medium text-gray-500">
              Ask anything about your sources
            </p>
            <p className="text-xs text-gray-300 mt-1">
              Add a source first, then start chatting
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="bg-blue-100 p-1.5 rounded-full h-fit shrink-0">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-sm"
                    : "bg-white text-gray-700 shadow-sm rounded-tl-sm"
                }`}
              >
                {msg.role === "assistant" ? (
                  <>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {[...new Set(msg.sources)].map((source, i) => (
                        <span
                          key={i}
                          className="text-xs bg-blue-50 text-bluw-500 px-2 py-0.5 rounded-full border border-blue-100"
                        >
                          📄 {source}
                        </span>
                      ))}
                    </div>
                  )}
                  <button 
                  onClick={() => onSaveNote(msg.content)}
                  className="mt-2 flex items-center gap-1 text-xs text-gray-300 hover:text-blue-500 transition-colors"
                  >
                    <StickyNote className="w-3 h-3" />
                    Save as note
                  </button>
                  </>
                ) : (
                  msg.content
                )}
              </div>
              {msg.role === "user" && (
                <div className="bg-gray-200 p-1.5 rounded-full h-fit shrink-0">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="bg-blue-100 p-1.5 rounded-full h-fit">
              <Bot className="w-4 h-4 text-blue-600" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm max-w-[80%]">
              <div className="flex gap-1 items-center h-4 mb-1">
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
              <p className="text-xs text-gray-300">Searching sources...</p>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask a question about your sources..."
            rows={1}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-300 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}