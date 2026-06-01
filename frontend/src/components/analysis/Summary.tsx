import React from "react";
import { Copy, Check } from "lucide-react";
import { useCopy } from "@/hooks/useCopy";

interface SummaryProps {
  summary: string;
  sentiment: string;
  processingTimeMs: number;
  wordCount: number;
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "text-green-400",
  neutral: "text-zinc-500",
  negative: "text-red-400",
};

export const Summary: React.FC<SummaryProps> = ({
  summary,
  sentiment,
  processingTimeMs,
  wordCount,
}) => {
  const { copied, copy } = useCopy();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Summary</span>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-mono ${SENTIMENT_COLORS[sentiment] ?? "text-zinc-500"}`}>
            {sentiment}
          </span>
          <span className="text-xs text-zinc-600 font-mono">
            {wordCount.toLocaleString()} words · {(processingTimeMs / 1000).toFixed(1)}s
          </span>
          <button
            onClick={() => copy(summary)}
            className="text-zinc-600 hover:text-zinc-300 transition-colors"
            aria-label="Copy summary"
            title="Copy summary"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-zinc-300">{summary}</p>
    </div>
  );
};
