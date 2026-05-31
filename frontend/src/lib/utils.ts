import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Analysis } from "@/types";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "…";
}

export function analysisToMarkdown(a: Analysis): string {
  const lines: string[] = [];
  const title = a.file_name ?? "Meeting Analysis";
  lines.push(`# ${title}`, "");
  lines.push(`**Date:** ${formatDate(a.created_at)}  `);
  lines.push(`**Sentiment:** ${a.sentiment}  `);
  if (a.provider && a.model) lines.push(`**Model:** ${a.provider}/${a.model}  `);
  lines.push("");

  lines.push("## Summary", "", a.summary, "");

  if (a.key_decisions.length > 0) {
    lines.push("## Key Decisions", "");
    a.key_decisions.forEach((d, i) => lines.push(`${i + 1}. ${d}`));
    lines.push("");
  }

  if (a.action_items.length > 0) {
    lines.push("## Action Items", "");
    a.action_items.forEach((item) => {
      const assignee = item.assignee ? ` — ${item.assignee}` : "";
      const due = item.due_date ? ` *(${item.due_date})*` : "";
      const priority = `[${item.priority}]`;
      lines.push(`- [ ] ${item.task}${assignee}${due} ${priority}`);
    });
    lines.push("");
  }

  if (a.participants.length > 0) {
    lines.push("## Participants", "");
    lines.push(a.participants.join(", "), "");
  }

  if (a.topics_discussed.length > 0) {
    lines.push("## Topics Discussed", "");
    a.topics_discussed.forEach((t) => lines.push(`- ${t}`));
    lines.push("");
  }

  if (a.next_meeting) {
    lines.push("## Next Meeting", "", a.next_meeting, "");
  }

  return lines.join("\n");
}

export function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
