import React from "react";
import { FileDown, Braces } from "lucide-react";
import { Summary } from "./Summary";
import { ActionItems } from "./ActionItems";
import { Participants } from "./Participants";
import { TagEditor } from "./TagEditor";
import { analysisToMarkdown, downloadFile } from "@/lib/utils";
import type { Analysis } from "@/types";

interface AnalysisResultProps {
  analysis: Analysis;
  onSelectAnalysis?: (id: string) => void;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ analysis, onSelectAnalysis }) => {
  const slug = (analysis.file_name ?? "analysis").replace(/\.[^.]+$/, "");

  const exportMarkdown = () => {
    downloadFile(analysisToMarkdown(analysis), `${slug}.md`, "text/markdown");
  };

  const exportJson = () => {
    downloadFile(JSON.stringify(analysis, null, 2), `${slug}.json`, "application/json");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-medium text-zinc-100">Analysis Result</h1>
        <div className="flex items-center gap-3">
          {analysis.model && (
            <span className="text-xs font-mono text-zinc-600">
              {analysis.provider}/{analysis.model}
            </span>
          )}
          <button
            onClick={exportMarkdown}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
            title="Export as Markdown"
          >
            <FileDown className="w-3.5 h-3.5" />
            MD
          </button>
          <button
            onClick={exportJson}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
            title="Export as JSON"
          >
            <Braces className="w-3.5 h-3.5" />
            JSON
          </button>
        </div>
      </div>

      <div className="border border-zinc-800 rounded-md divide-y divide-zinc-800">
        <div className="p-4">
          <TagEditor
            analysisId={analysis.id}
            initialTags={analysis.tags ?? []}
          />
        </div>
        <div className="p-4">
          <Summary
            summary={analysis.summary}
            sentiment={analysis.sentiment}
            processingTimeMs={analysis.processing_time_ms}
            wordCount={analysis.word_count}
          />
        </div>

        <div className="p-4">
          <ActionItems
            items={analysis.action_items}
            analysisId={analysis.id}
            initialCompleted={analysis.completed_items ?? []}
          />
        </div>

        <div className="p-4">
          <Participants
            participants={analysis.participants}
            topics={analysis.topics_discussed}
            nextMeeting={analysis.next_meeting}
            keyDecisions={analysis.key_decisions}
            onSelectAnalysis={onSelectAnalysis}
          />
        </div>
      </div>
    </div>
  );
};
