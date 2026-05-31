import React, { useState, useCallback, useRef } from "react";
import { Plus, Settings, Clock, Trash2, Search, X } from "lucide-react";
import { usePaginatedHistory, useDeleteAnalysis } from "@/hooks/useHistory";
import { formatDate, truncate } from "@/lib/utils";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { toast } from "sonner";
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
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const { allItems: historyItems, hasMore, isFetching, loadMore } = usePaginatedHistory(search, activeTag);
  const deleteMutation = useDeleteAnalysis();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());
  const timeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const handleDelete = useCallback((item: Analysis) => {
    if (selectedId === item.id) onSelectAnalysis(null);

    setPendingDeletes((prev) => new Set(prev).add(item.id));

    const timeoutId = setTimeout(() => {
      deleteMutation.mutate(item.id);
      setPendingDeletes((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
      timeouts.current.delete(item.id);
    }, 5000);

    timeouts.current.set(item.id, timeoutId);

    toast("Analysis deleted.", {
      action: {
        label: "Undo",
        onClick: () => {
          clearTimeout(timeouts.current.get(item.id));
          timeouts.current.delete(item.id);
          setPendingDeletes((prev) => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });
        },
      },
      duration: 5000,
    });
  }, [selectedId, onSelectAnalysis, deleteMutation]);

  const allItems = [
    ...(currentAnalysis && !historyItems.find((i) => i.id === currentAnalysis.id)
      ? [currentAnalysis]
      : []),
    ...historyItems,
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

        <div className="px-3 py-2 space-y-1.5">
          <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5">
            <Search className="w-3 h-3 text-zinc-500 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setActiveTag(""); }}
              placeholder="Search history..."
              className="bg-transparent text-xs text-zinc-300 placeholder-zinc-600 outline-none w-full"
            />
          </div>
          {activeTag && (
            <button
              onClick={() => setActiveTag("")}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              <X className="w-3 h-3" /> #{activeTag}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          {allItems.length === 0 && !isFetching && (
            <p className="px-2 py-3 text-xs text-zinc-600">No analyses yet.</p>
          )}
          {allItems.map((item) => {
            const isPending = pendingDeletes.has(item.id);
            return (
              <div
                key={item.id}
                className={`group flex items-start justify-between gap-1 px-2 py-2 rounded cursor-pointer transition-all ${
                  isPending
                    ? "opacity-30 pointer-events-none"
                    : selectedId === item.id
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                }`}
                onClick={() => !isPending && onSelectAnalysis(item.id)}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs truncate text-zinc-300">
                    {truncate(item.summary || item.file_name || "Untitled", 40)}
                  </p>
                  <p className="text-xs text-zinc-600 mt-0.5 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {formatDate(item.created_at)}
                  </p>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.tags.slice(0, 3).map((tag) => (
                        <button
                          key={tag}
                          onClick={(e) => { e.stopPropagation(); setActiveTag(tag); }}
                          className="text-xs text-zinc-500 hover:text-blue-400 transition-colors"
                        >
                          #{tag}
                        </button>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="text-xs text-zinc-600">+{item.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-opacity shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={isFetching}
              className="w-full mt-1 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 rounded transition-colors disabled:opacity-40"
            >
              {isFetching ? "Loading..." : "Load more"}
            </button>
          )}
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
