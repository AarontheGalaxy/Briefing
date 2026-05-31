import React from "react";
import { Copy, Check } from "lucide-react";
import { useCopy } from "@/hooks/useCopy";

interface ParticipantsProps {
  participants: string[];
  topics: string[];
  nextMeeting: string | null;
  keyDecisions: string[];
}

export const Participants: React.FC<ParticipantsProps> = ({
  participants,
  topics,
  nextMeeting,
  keyDecisions,
}) => {
  const { copied, copy } = useCopy();

  return (
    <div className="space-y-4">
      {keyDecisions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Key Decisions
            </span>
            <button
              onClick={() => copy(keyDecisions.map((d, i) => `${i + 1}. ${d}`).join("\n"))}
              className="text-zinc-600 hover:text-zinc-300 transition-colors"
              title="Copy key decisions"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="space-y-1.5">
            {keyDecisions.map((decision, i) => (
              <div key={i} className="border-l-2 border-zinc-700 pl-3">
                <p className="text-sm text-zinc-300">{decision}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {participants.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Participants
            </span>
            <div className="flex flex-wrap gap-1.5">
              {participants.map((p) => (
                <span
                  key={p}
                  className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded border border-zinc-700"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {topics.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Topics
            </span>
            <div className="flex flex-wrap gap-1.5">
              {topics.map((t) => (
                <span
                  key={t}
                  className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded border border-zinc-700"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {nextMeeting && (
        <div className="mt-2">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Next Meeting
          </span>
          <p className="mt-1 text-sm font-mono text-zinc-400">{nextMeeting}</p>
        </div>
      )}
    </div>
  );
};
