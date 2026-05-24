import React from "react";
import { Summary } from "./Summary";
import { ActionItems } from "./ActionItems";
import { Participants } from "./Participants";
import type { Analysis } from "@/types";

interface AnalysisResultProps {
  analysis: Analysis;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ analysis }) => {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-medium text-zinc-100">Analysis Result</h1>
        {analysis.model && (
          <span className="text-xs font-mono text-zinc-600">
            {analysis.provider}/{analysis.model}
          </span>
        )}
      </div>

      <div className="border border-zinc-800 rounded-md divide-y divide-zinc-800">
        <div className="p-4">
          <Summary
            summary={analysis.summary}
            sentiment={analysis.sentiment}
            processingTimeMs={analysis.processing_time_ms}
            wordCount={analysis.word_count}
          />
        </div>

        <div className="p-4">
          <ActionItems items={analysis.action_items} />
        </div>

        <div className="p-4">
          <Participants
            participants={analysis.participants}
            topics={analysis.topics_discussed}
            nextMeeting={analysis.next_meeting}
            keyDecisions={analysis.key_decisions}
          />
        </div>
      </div>
    </div>
  );
};
