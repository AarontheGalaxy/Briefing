import React from "react";
import { X, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchParticipantAnalyses } from "@/lib/api";
import { formatDate, truncate } from "@/lib/utils";

interface ParticipantModalProps {
  name: string;
  onClose: () => void;
  onSelectAnalysis: (id: string) => void;
}

export const ParticipantModal: React.FC<ParticipantModalProps> = ({
  name,
  onClose,
  onSelectAnalysis,
}) => {
  const { data, isLoading } = useQuery({
    queryKey: ["participant-analyses", name],
    queryFn: () => fetchParticipantAnalyses(name),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div>
            <p className="text-sm font-medium text-zinc-100">{name}</p>
            <p className="text-xs text-zinc-500">
              {data ? `${data.total} meeting${data.total !== 1 ? "s" : ""}` : "Loading…"}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800">
          {isLoading && (
            <div className="px-4 py-6 text-center text-xs text-zinc-600">Loading…</div>
          )}
          {!isLoading && data?.items.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-zinc-600">No meetings found.</div>
          )}
          {data?.items.map((item) => (
            <button
              key={item.id}
              onClick={() => { onSelectAnalysis(item.id); onClose(); }}
              className="w-full text-left px-4 py-3 hover:bg-zinc-800/60 transition-colors"
            >
              <p className="text-xs text-zinc-300 truncate">
                {truncate(item.summary || item.file_name || "Untitled", 60)}
              </p>
              <p className="text-xs text-zinc-600 mt-0.5 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {formatDate(item.created_at)}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
