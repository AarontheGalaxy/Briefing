import React, { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { useCopy } from "@/hooks/useCopy";
import { updateCompletedItems } from "@/lib/api";
import type { ActionItem } from "@/types";

interface ActionItemsProps {
  items: ActionItem[];
  analysisId: string;
  initialCompleted?: number[];
}

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-400",
  medium: "bg-yellow-400",
  low: "bg-zinc-600",
};

export const ActionItems: React.FC<ActionItemsProps> = ({
  items,
  analysisId,
  initialCompleted = [],
}) => {
  const [checked, setChecked] = useState<Set<number>>(new Set(initialCompleted));
  const { copied, copy } = useCopy();

  const toggle = useCallback((i: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      updateCompletedItems(analysisId, Array.from(next)).catch(() => {});
      return next;
    });
  }, [analysisId]);

  const copyText = items
    .map((item, i) => {
      const status = checked.has(i) ? "[x]" : "[ ]";
      const assignee = item.assignee ? ` — ${item.assignee}` : "";
      const due = item.due_date ? ` (${item.due_date})` : "";
      return `${status} ${item.task}${assignee}${due}`;
    })
    .join("\n");

  if (items.length === 0) {
    return (
      <div>
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          Action Items
        </span>
        <p className="mt-2 text-xs text-zinc-600">No action items identified.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          Action Items
        </span>
        <button
          onClick={() => copy(copyText)}
          className="text-zinc-600 hover:text-zinc-300 transition-colors"
          title="Copy action items"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 p-2 rounded transition-colors ${
              checked.has(i) ? "opacity-40" : ""
            }`}
          >
            <div className="flex items-center pt-0.5">
              <input
                type="checkbox"
                checked={checked.has(i)}
                onChange={() => toggle(i)}
                className="w-3.5 h-3.5 rounded-sm bg-zinc-800 border border-zinc-700 accent-blue-500 cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-1.5 pt-0.5 shrink-0">
              <span
                className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[item.priority] ?? "bg-zinc-600"}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm text-zinc-300 ${checked.has(i) ? "line-through" : ""}`}>
                {item.task}
              </p>
              <div className="flex items-center gap-3 mt-0.5">
                {item.assignee && (
                  <span className="font-mono text-xs text-zinc-400">{item.assignee}</span>
                )}
                {item.due_date && (
                  <span className="text-xs text-zinc-600">{item.due_date}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
