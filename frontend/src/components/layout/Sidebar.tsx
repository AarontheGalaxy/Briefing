import React, { useState } from "react";
import { Plus, Settings, Clock, Trash2 } from "lucide-react";
import { useHistory, useDeleteAnalysis } from "@/hooks/useHistory";
import { formatDate, truncate } from "@/lib/utils";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import type { Analysis } from "@/types";

interface SidebarProps {
  selectedId: string | null;
  onSelectAnalysis: (id: string | null) => void;
  onNewAnalysis: () => void;
  currentAnalysis: Analysis | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedId,
  onSelectAnalysis,
  onNewAnalysis,
  currentAnalysis,
}) => {
  const { data } = useHistory();
  const deleteMutation = useDeleteAnalysis();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const allItems = [
    ...(currentAnalysis && !data?.items.find((i) => i.id === currentAnalysis.id)
      ? [currentAnalysis]
      : []),
    ...(data?.items ?? []),
  ];

  return (
    <>
      <aside className="w-60 h-screen flex flex-col bg-zinc-900 border-r border-zinc-800 shrink-0">
        <div className="px-4 py-4 border-b border-zinc-800">
          <span className="text-sm font-medium text-zinc-100 tracking-tight">Briefing</span>
        </div>

        <div className="px-3 py-3">
          <button
            onClick={onNewAnalysis}
            className="w-full flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm rounded border border-zinc-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Analysis
          </button>
        </div>

        <div className="px-4 py-2">
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">History</span>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          {allItems.length === 0 && (
            <p className="px-2 py-3 text-xs text-zinc-600">No analyses yet.</p>
          )}
          {allItems.map((item) => (
            <div
              key={item.id}
              className={`group flex items-start justify-between gap-1 px-2 py-2 rounded cursor-pointer transition-colors ${
                selectedId === item.id
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
              }`}
              onClick={() => onSelectAnalysis(item.id)}
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs truncate text-zinc-300">
                  {truncate(item.summary || item.file_name || "Untitled", 40)}
                </p>
                <p className="text-xs text-zinc-600 mt-0.5 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {formatDate(item.created_at)}
                </p>
              </div>
              <button
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-opacity shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedId === item.id) onSelectAnalysis(null);
                  deleteMutation.mutate(item.id);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-zinc-800 px-3 py-3">
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-sm rounded transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Settings
          </button>
        </div>
      </aside>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
};
