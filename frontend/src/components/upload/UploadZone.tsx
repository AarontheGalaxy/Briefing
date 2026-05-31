import React, { useCallback, useRef, useState } from "react";
import { Upload, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadFile, getErrorMessage } from "@/lib/api";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useSettingsStore } from "@/store/settingsStore";
import { ModelSelector } from "./ModelSelector";
import { toast } from "sonner";
import type { Analysis, MeetingType } from "@/types";

const MEETING_TYPES: { value: MeetingType; label: string }[] = [
  { value: "general", label: "General" },
  { value: "sales", label: "Sales" },
  { value: "one_on_one", label: "1:1" },
  { value: "sprint_review", label: "Sprint Review" },
  { value: "board", label: "Board Meeting" },
];

const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"];
const MAX_CHARS = 100_000;

interface UploadZoneProps {
  onAnalysisComplete: (analysis: Analysis) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onAnalysisComplete }) => {
  const [activeTab, setActiveTab] = useState<"file" | "text">("file");
  const [dragActive, setDragActive] = useState(false);
  const [uploadedText, setUploadedText] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedWordCount, setUploadedWordCount] = useState<number | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [meetingType, setMeetingType] = useState<MeetingType>("general");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { provider, model, apiKey } = useSettingsStore();
  const analysisMutation = useAnalysis();

  const handleFile = useCallback(async (file: File) => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      toast.error("Only PDF, DOCX, and TXT files are supported.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File exceeds the 50MB limit.");
      return;
    }
    setUploading(true);
    try {
      const result = await uploadFile(file);
      setUploadedText(result.text);
      setUploadedFileName(result.file_name);
      setUploadedWordCount(result.word_count);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to upload file. Please try again."));
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleAnalyze = async () => {
    const text = activeTab === "file" ? uploadedText : pastedText;
    if (!text?.trim()) {
      toast.error("Please provide meeting notes to analyze.");
      return;
    }
    try {
      const result = await analysisMutation.mutateAsync({
        text: text.trim(),
        provider,
        model,
        api_key: apiKey || null,
        meeting_type: meetingType,
      });
      onAnalysisComplete(result);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Analysis failed. Please try again."));
    }
  };

  const isLoading = analysisMutation.isPending;
  const canAnalyze = activeTab === "file" ? !!uploadedText : !!pastedText.trim();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-sm font-medium text-zinc-100 mb-1">New Analysis</h1>
        <p className="text-xs text-zinc-500">
          Upload a meeting file or paste notes directly.
        </p>
      </div>

      <div className="flex gap-1 mb-4 border-b border-zinc-800 pb-0">
        {(["file", "text"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab
                ? "border-blue-500 text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            )}
          >
            {tab === "file" ? "Upload File" : "Paste Text"}
          </button>
        ))}
      </div>

      {activeTab === "file" && (
        <div className="space-y-4">
          {!uploadedText ? (
            <div
              className={cn(
                "border border-dashed border-zinc-700 rounded-md p-8 text-center cursor-pointer transition-colors",
                dragActive && "border-blue-500 bg-zinc-800/50",
                uploading && "opacity-60 pointer-events-none"
              )}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-5 h-5 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm text-zinc-400 mb-1">
                {uploading ? "Uploading..." : "Drop a file here or click to browse"}
              </p>
              <p className="text-xs text-zinc-600">
                Supported: {SUPPORTED_EXTENSIONS.join(", ")} — max 50MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={SUPPORTED_EXTENSIONS.join(",")}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>
          ) : (
            <div className="border border-zinc-800 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm text-zinc-300">{uploadedFileName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-600">{uploadedWordCount?.toLocaleString()} words</span>
                  <button
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    onClick={() => {
                      setUploadedText(null);
                      setUploadedFileName(null);
                      setUploadedWordCount(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "text" && (
        <div className="relative">
          <textarea
            className="w-full min-h-64 bg-zinc-900 border border-zinc-800 rounded-md p-3 font-mono text-sm text-zinc-300 placeholder-zinc-600 resize-y focus:outline-none focus:border-zinc-700 transition-colors"
            placeholder="Paste your meeting notes or transcript here..."
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value.slice(0, MAX_CHARS))}
            maxLength={MAX_CHARS}
          />
          <span className="absolute bottom-3 right-3 text-xs text-zinc-600 pointer-events-none">
            {pastedText.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ModelSelector />
          <select
            value={meetingType}
            onChange={(e) => setMeetingType(e.target.value as MeetingType)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded px-2 py-1.5 focus:outline-none focus:border-zinc-700 transition-colors"
          >
            {MEETING_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <button
          disabled={!canAnalyze || isLoading}
          onClick={handleAnalyze}
          className={cn(
            "px-4 py-2 text-sm rounded font-medium transition-colors shrink-0",
            canAnalyze && !isLoading
              ? "bg-blue-600 hover:bg-blue-500 text-white"
              : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
          )}
        >
          {isLoading ? "Analyzing..." : "Analyze"}
        </button>
      </div>
    </div>
  );
};
