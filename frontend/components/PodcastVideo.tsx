"use client";
import { useState, useRef, useEffect } from "react";
import {
  X, Video, Download, Play,
  Upload, Loader2, CheckCircle,
  AlertCircle,
} from "lucide-react";
import { uploadSpeakerImage, generateDIDVideo } from "@/lib/api";

interface Segment {
  speaker: string;
  text: string;
}

interface Script {
  title: string;
  segments: Segment[];
}

interface Props {
  script: Script;
  notebookTitle: string;
  notebookId: string;
  onClose: () => void;
}

interface VideoClip {
  segment: Segment;
  videoUrl: string;
  index: number;
}

export default function PodcastVideo({
  script,
  notebookTitle,
  notebookId,
  onClose,
}: Props) {
  const [hostFile, setHostFile] = useState<File | null>(null);
  const [guestFile, setGuestFile] = useState<File | null>(null);
  const [hostPreview, setHostPreview] = useState("");
  const [guestPreview, setGuestPreview] = useState("");
  // Store full S3 URLs — NOT just IDs
  const [hostImageUrl, setHostImageUrl] = useState("");
  const [guestImageUrl, setGuestImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedClips, setGeneratedClips] = useState<VideoClip[]>([]);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const handleImageSelect = async (file: File, speaker: "host" | "guest") => {
    const preview = URL.createObjectURL(file);
    if (speaker === "host") {
      setHostFile(file);
      setHostPreview(preview);
    } else {
      setGuestFile(file);
      setGuestPreview(preview);
    }
  };

  const handleUploadImages = async () => {
    if (!hostFile || !guestFile) return;
    setIsUploading(true);
    setError("");

    try {
      setCurrentStep("Uploading Host photo to D-ID...");
      const hostResult = await uploadSpeakerImage(notebookId, hostFile);
      // Store the full S3 URL returned from D-ID
      setHostImageUrl(hostResult.image_url);

      setCurrentStep("Uploading Guest photo to D-ID...");
      const guestResult = await uploadSpeakerImage(notebookId, guestFile);
      setGuestImageUrl(guestResult.image_url);

      setCurrentStep("✅ Photos uploaded! Ready to generate video.");
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      setError(
        Array.isArray(detail)
          ? detail.map((d: any) => d.msg).join(", ")
          : typeof detail === "string"
          ? detail
          : "Failed to upload images"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!hostImageUrl || !guestImageUrl) return;
    setIsGenerating(true);
    setError("");
    setGeneratedClips([]);
    const clips: VideoClip[] = [];

    try {
      for (let i = 0; i < script.segments.length; i++) {
        const segment = script.segments[i];
        const isHost = segment.speaker === "Host";
        const imageUrl = isHost ? hostImageUrl : guestImageUrl;

        // Clean the text before sending
        const cleanText = segment.text
          .replace(/[^\x20-\x7E\s]/g, "")
          .trim();

        setCurrentStep(
          `Generating clip ${i + 1}/${script.segments.length}: ${segment.speaker} speaking...`
        );
        setProgress(Math.round((i / script.segments.length) * 100));

        console.log(`[Video] Sending text: ${cleanText.slice(0, 80)}`);
        console.log(`[Video] Image URL: ${imageUrl.slice(0, 60)}`);

        const result = await generateDIDVideo(
          notebookId,
          imageUrl,
          cleanText
        );

        clips.push({
          segment,
          videoUrl: result.video_url,
          index: i,
        });

        setGeneratedClips([...clips]);
      }

      setProgress(100);
      setCurrentStep(`✅ All ${clips.length} clips generated!`);
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : "Failed to generate video — check console for details"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadClip = (clip: VideoClip) => {
    const a = document.createElement("a");
    a.href = clip.videoUrl;
    a.download = `${script.title}-${clip.segment.speaker}-${clip.index + 1}.mp4`;
    a.target = "_blank";
    a.click();
  };

  const bothUploaded = !!hostImageUrl && !!guestImageUrl;
  const bothSelected = !!hostFile && !!guestFile;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Podcast Video</h2>
              <p className="text-blue-200 text-xs">{script.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">

          {/* Step 1 — Upload Photos */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                bothUploaded ? "bg-green-500 text-white" : "bg-blue-600 text-white"
              }`}>
                {bothUploaded ? <CheckCircle className="w-4 h-4" /> : "1"}
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">
                Upload Speaker Photos
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Host */}
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium">Host Photo</p>
                <label className="cursor-pointer block">
                  <div className={`w-full h-40 rounded-xl overflow-hidden border-2 border-dashed transition-colors flex items-center justify-center ${
                    hostPreview ? "border-blue-200" : "border-gray-200 hover:border-blue-300 bg-gray-50"
                  }`}>
                    {hostPreview ? (
                      <img src={hostPreview} alt="Host" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">Click to upload host photo</p>
                        <p className="text-xs text-gray-300 mt-1">JPG, PNG recommended</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f, "host"); }}
                    className="hidden"
                  />
                </label>
                {hostImageUrl && (
                  <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Uploaded to D-ID
                  </p>
                )}
              </div>

              {/* Guest */}
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium">Guest Photo</p>
                <label className="cursor-pointer block">
                  <div className={`w-full h-40 rounded-xl overflow-hidden border-2 border-dashed transition-colors flex items-center justify-center ${
                    guestPreview ? "border-purple-200" : "border-gray-200 hover:border-purple-300 bg-gray-50"
                  }`}>
                    {guestPreview ? (
                      <img src={guestPreview} alt="Guest" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">Click to upload guest photo</p>
                        <p className="text-xs text-gray-300 mt-1">JPG, PNG recommended</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f, "guest"); }}
                    className="hidden"
                  />
                </label>
                {guestImageUrl && (
                  <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Uploaded to D-ID
                  </p>
                )}
              </div>
            </div>

            {/* Upload Button */}
            {bothSelected && !bothUploaded && (
              <button
                onClick={handleUploadImages}
                disabled={isUploading}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isUploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />{currentStep}</>
                ) : (
                  <><Upload className="w-4 h-4" />Upload Photos to D-ID</>
                )}
              </button>
            )}
          </div>

          {/* Step 2 — Generate Videos */}
          {bothUploaded && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  generatedClips.length === script.segments.length
                    ? "bg-green-500 text-white"
                    : "bg-blue-600 text-white"
                }`}>
                  {generatedClips.length === script.segments.length
                    ? <CheckCircle className="w-4 h-4" /> : "2"}
                </div>
                <h3 className="font-semibold text-gray-800 text-sm">Generate Video Clips</h3>
                <span className="text-xs text-gray-400">({script.segments.length} segments)</span>
              </div>

              {isGenerating && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>{currentStep}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl mb-4">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              {!isGenerating && generatedClips.length === 0 && (
                <button
                  onClick={handleGenerate}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Generate Lip-Synced Video Clips
                </button>
              )}

              {generatedClips.length > 0 && (
                <div className="space-y-2">
                  {generatedClips.map((clip, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        clip.segment.speaker === "Host"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}>
                        {clip.segment.speaker === "Host" ? "H" : "G"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700">
                          Clip {clip.index + 1} — {clip.segment.speaker}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {clip.segment.text.slice(0, 60)}...
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownloadClip(clip)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 text-xs font-medium rounded-lg hover:bg-green-100 transition-colors border border-green-200 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                    </div>
                  ))}

                  {!isGenerating && generatedClips.length === script.segments.length && (
                    <button
                      onClick={handleGenerate}
                      className="w-full mt-2 px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Regenerate All Clips
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}