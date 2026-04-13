"use client";
import { useState, useEffect, useRef } from "react";
import {
  X, Play, Pause, Volume2, Loader2, Mic,
  ChevronDown, ChevronUp, RotateCcw, Download, Video
} from "lucide-react";
import PodcastVideo from "./PodcastVideo";


interface Segment {
  speaker: string;
  text: string;
}

interface Script {
  title: string;
  segments: Segment[];
}

interface Props {
  notebookId: string;
  notebookTitle: string;
  onClose: () => void;
  onGenerate: () => Promise<Script>;
}

export default function AudioOverview({ notebookId, notebookTitle, onClose, onGenerate }: Props) {
  const [script, setScript] = useState<Script | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegment, setCurrentSegment] = useState(-1);
  const [showTranscript, setShowTranscript] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [error, setError] = useState("");

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const segmentRef = useRef(0);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    handleGenerate();
    return () => {
      synthRef.current?.cancel();
    };
  }, []);

  useEffect(() => {
    if (currentSegment >= 0) {
      const el = document.getElementById(`segment-${currentSegment}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentSegment]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError("");
    try {
      const data = await onGenerate();
      setScript(data);
    } catch (e) {
      setError("Failed to generate script — please try again");
    } finally {
      setIsGenerating(false);
    }
  };

  const getVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    const hostVoice =
      voices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("male")) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0];
    const guestVoice =
      voices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("female") && v !== hostVoice) ||
      voices.find((v) => v.lang.startsWith("en") && v !== hostVoice) ||
      voices[1] || voices[0];
    return { hostVoice, guestVoice };
  };

  const playFromSegment = (startIndex: number) => {
    if (!script) return;
    synthRef.current?.cancel();
    segmentRef.current = startIndex;

    const speakSegment = (index: number) => {
      if (index >= script.segments.length) {
        setIsPlaying(false);
        setCurrentSegment(-1);
        return;
      }

      setCurrentSegment(index);
      const segment = script.segments[index];
      const utterance = new SpeechSynthesisUtterance(segment.text);
      const { hostVoice, guestVoice } = getVoices();

      utterance.voice = segment.speaker === "Host" ? hostVoice : guestVoice;
      utterance.rate = 0.95;
      utterance.pitch = segment.speaker === "Host" ? 1.0 : 1.15;
      utterance.volume = 1;

      utterance.onend = () => {
        segmentRef.current = index + 1;
        speakSegment(index + 1);
      };

      utterance.onerror = () => setIsPlaying(false);
      synthRef.current?.speak(utterance);
    };

    speakSegment(startIndex);
    setIsPlaying(true);
  };

  const handlePlayPause = () => {
    if (!script) return;
    if (isPlaying) {
      synthRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (synthRef.current?.paused) {
        synthRef.current.resume();
        setIsPlaying(true);
      } else {
        playFromSegment(segmentRef.current || 0);
      }
    }
  };

  const handleRestart = () => {
    synthRef.current?.cancel();
    setCurrentSegment(-1);
    setIsPlaying(false);
    segmentRef.current = 0;
    setTimeout(() => playFromSegment(0), 100);
  };

  const handleDownload = () => {
    if (!script) return;
    const text = script.segments
      .map((s) => `${s.speaker}:\n${s.text}`)
      .join("\n\n");
    const blob = new Blob([`${script.title}\n\n${text}`], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${script.title || "audio-overview"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const progress =
    script && currentSegment >= 0
      ? Math.round(((currentSegment + 1) / script.segments.length) * 100)
      : 0;

  return (
  <>
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-semibold">Audio Overview</h2>
                <p className="text-blue-200 text-xs">
                  {script ? script.title : "Generating your podcast..."}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                synthRef.current?.cancel();
                onClose();
              }}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-ping" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  Writing your podcast script...
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Groq is analyzing all your sources
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={handleGenerate}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : script ? (
            <>
              {/* Player Controls */}
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={handlePlayPause}
                  className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors shrink-0 shadow-md"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </button>

                <button
                  onClick={handleRestart}
                  className="w-9 h-9 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center transition-colors shrink-0"
                  title="Restart"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-600 text-xs font-medium rounded-xl hover:bg-green-100 transition-colors border border-green-200 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Script
                </button>

                <button
                  onClick={() => setShowVideo(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-600 text-xs font-medium rounded-xl hover:bg-purple-100 transition-colors border border-purple-200 shrink-0"
                >
                  <Video className="w-3.5 h-3.5" />
                  Make Video
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>
                      {currentSegment >= 0
                        ? `${script.segments[currentSegment].speaker} speaking...`
                        : isPlaying
                        ? "Playing..."
                        : "Ready to play"}
                    </span>
                    <span>
                      {Math.max(currentSegment + 1, 0)}/
                      {script.segments.length} segments
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <Volume2 className="w-4 h-4 text-gray-400 shrink-0" />
              </div>

              {/* Transcript Toggle */}
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 mb-3 transition-colors"
              >
                {showTranscript ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    Hide transcript
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    Show transcript
                  </>
                )}
              </button>

              {/* Transcript */}
              {showTranscript && (
                <div
                  ref={transcriptRef}
                  className="max-h-64 overflow-y-auto space-y-3 pr-1"
                >
                  {script.segments.map((segment, i) => (
                    <div
                      id={`segment-${i}`}
                      key={i}
                      onClick={() => {
                        segmentRef.current = i;
                        playFromSegment(i);
                      }}
                      className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        currentSegment === i
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-gray-50 border border-transparent"
                      }`}
                    >
                      <div
                        className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                          segment.speaker === "Host"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {segment.speaker === "Host" ? "H" : "G"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-medium mb-0.5 ${
                            segment.speaker === "Host"
                              ? "text-blue-600"
                              : "text-purple-600"
                          }`}
                        >
                          {segment.speaker}
                        </p>
                        <p
                          className={`text-sm leading-relaxed ${
                            currentSegment === i
                              ? "text-gray-800"
                              : "text-gray-600"
                          }`}
                        >
                          {segment.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>

    {/* PodcastVideo rendered completely outside the modal */}
    {showVideo && script && (
      <PodcastVideo
        script={script}
        notebookTitle={notebookTitle}
        notebookId={notebookId}
        onClose={() => setShowVideo(false)}
      />
    )}
  </>
);
}