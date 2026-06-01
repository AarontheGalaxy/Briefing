import React, { useCallback, useRef, useState } from "react";
import { Upload, X, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadFile, analyzeText } from "@/lib/api";
import { useSettingsStore } from "@/store/settingsStore";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { MeetingType } from "@/types";

const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"];
const MAX_BYTES = 50 * 1024 * 1024;

type ItemStatus = "pending" | "uploading" | "analyzing" | "done" | "error";

interface BatchItem {
  id: string;
  file: File;
  status: ItemStatus;
  error?: string;
}

interface BatchUploadProps {
  meetingType: MeetingType;
}

const STATUS_ICON: Record<ItemStatus, React.ReactNode> = {
  pending: <span className="w-4 h-4 rounded-full border border-zinc-600 inline-block" />,
  uploading: <Loader className="w-4 h-4 text-blue-400 animate-spin" />,
  analyzing: <Loader className="w-4 h-4 text-yellow-400 animate-spin" />,
  done: <CheckCircle className="w-4 h-4 text-green-400" />,
  error: <AlertCircle className="w-4 h-4 text-red-400" />,
};

const STATUS_LABEL: Record<ItemStatus, string> = {
  pending: "Pending",
  uploading: "Uploading…",
  analyzing: "Analyzing…",
  done: "Done",
  error: "Failed",
};

export const BatchUpload: React.FC<BatchUploadProps> = ({ meetingType }) => {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [running, setRunning] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { provider, model, apiKey } = useSettingsStore();
  const queryClient = useQueryClient();

  const updateItem = (id: string, patch: Partial<BatchItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const addFiles = useCallback((files: FileList | File[]) => {
    const valid = Array.from(files).filter((f) => {
      const ext = "." + f.name.split(".").pop()?.toLowerCase();
      if (!SUPPORTED_EXTENSIONS.includes(ext)) return false;
      if (f.size > MAX_BYTES) return false;
      return true;
    });
    if (valid.length < files.length) {
      toast.error("Some files were skipped (unsupported type or over 50MB).");
    }
    const uuid = () =>
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Math.random().toString(36).slice(2)}-${Date.now()}`;

    setItems((prev) => [
      ...prev,
      ...valid.map((f) => ({
        id: uuid(),
        file: f,
        status: "pending" as ItemStatus,
      })),
    ]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((it) => it.id !== id));

  const runBatch = async () => {
    const pending = items.filter((it) => it.status === "pending" || it.status === "error");
    if (!pending.length) return;
    setRunning(true);

    for (const item of pending) {
      // Upload
      updateItem(item.id, { status: "uploading", error: undefined });
      let text: string;
      try {
        const uploaded = await uploadFile(item.file);
        text = uploaded.text;
      } catch {
        updateItem(item.id, { status: "error", error: "Upload failed" });
        continue;
      }

      // Analyze
      updateItem(item.id, { status: "analyzing" });
      try {
        await analyzeText({ text, provider, model, api_key: apiKey || null, meeting_type: meetingType });
        updateItem(item.id, { status: "done" });
        queryClient.invalidateQueries({ queryKey: ["history"] });
      } catch {
        updateItem(item.id, { status: "error", error: "Analysis failed" });
      }
    }

    setRunning(false);
    toast.success("Batch complete.");
  };

  const pendingCount = items.filter((it) => it.status === "pending" || it.status === "error").length;
  const doneCount = items.filter((it) => it.status === "done").length;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={cn(
          "border border-dashed border-zinc-700 rounded-md p-6 text-center cursor-pointer transition-colors",
          dragActive && "border-blue-500 bg-zinc-800/50"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-5 h-5 text-zinc-600 mx-auto mb-2" />
        <p className="text-sm text-zinc-400">Drop multiple files or click to browse</p>
        <p className="text-xs text-zinc-600 mt-1">
          {SUPPORTED_EXTENSIONS.join(", ")} — max 50MB each
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept={SUPPORTED_EXTENSIONS.join(",")}
          onChange={(e) => { if (e.target.files) addFiles(e.target.files); }}
        />
      </div>

      {/* Queue */}
      {items.length > 0 && (
        <div className="border border-zinc-800 rounded-md divide-y divide-zinc-800">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-3 py-2">
              <span className="shrink-0">{STATUS_ICON[item.status]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-300 truncate">{item.file.name}</p>
                {item.error && (
                  <p className="text-xs text-red-400">{item.error}</p>
                )}
              </div>
              <span className="text-xs text-zinc-600 shrink-0">
                {STATUS_LABEL[item.status]}
              </span>
              {item.status === "error" && !running && (
                <button
                  onClick={() => updateItem(item.id, { status: "pending", error: undefined })}
                  className="text-xs text-yellow-400 hover:text-yellow-200 transition-colors shrink-0"
                  title="Retry"
                >
                  ↺
                </button>
              )}
              {(item.status === "pending" || item.status === "error") && !running && (
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      {items.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-600">
            {doneCount}/{items.length} completed
          </span>
          <div className="flex items-center gap-2">
            {!running && (
              <button
                onClick={() => setItems([])}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={runBatch}
              disabled={running || pendingCount === 0}
              className={cn(
                "px-4 py-1.5 text-sm rounded font-medium transition-colors",
                !running && pendingCount > 0
                  ? "bg-blue-600 hover:bg-blue-500 text-white"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              )}
            >
              {running ? "Running…" : `Analyze ${pendingCount} file${pendingCount !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
