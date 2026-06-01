import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Analysis } from "@/types";
import { toast } from "sonner";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
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

function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function printAnalysis(a: Analysis): void {
  const title = a.file_name ?? "Meeting Analysis";
  const date = formatDate(a.created_at);

  const actionItemsHtml = a.action_items.length
    ? `<ul>${a.action_items
        .map(
          (item) =>
            `<li><strong>[${esc(item.priority)}]</strong> ${esc(item.task)}${item.assignee ? ` — <em>${esc(item.assignee)}</em>` : ""}${item.due_date ? ` (${esc(item.due_date)})` : ""}</li>`
        )
        .join("")}</ul>`
    : "<p><em>No action items.</em></p>";

  const decisionsHtml = a.key_decisions.length
    ? `<ol>${a.key_decisions.map((d) => `<li>${esc(d)}</li>`).join("")}</ol>`
    : "<p><em>None.</em></p>";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${esc(title)}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 720px; margin: 40px auto; color: #111; font-size: 14px; line-height: 1.6; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .meta { color: #555; font-size: 12px; margin-bottom: 24px; }
    h2 { font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-top: 24px; }
    ul, ol { padding-left: 20px; }
    li { margin-bottom: 4px; }
    .tags span { display: inline-block; background: #f0f0f0; border: 1px solid #ddd; border-radius: 999px; padding: 1px 8px; font-size: 11px; margin-right: 4px; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>${esc(title)}</h1>
  <div class="meta">${esc(date)} · ${esc(a.sentiment)} · ${a.word_count.toLocaleString()} words${a.provider ? ` · ${esc(a.provider)}/${esc(a.model!)}` : ""}</div>
  ${a.tags && a.tags.length ? `<div class="tags">${a.tags.map((t) => `<span>#${esc(t)}</span>`).join("")}</div><br/>` : ""}
  <h2>Summary</h2>
  <p>${esc(a.summary)}</p>
  <h2>Key Decisions</h2>
  ${decisionsHtml}
  <h2>Action Items</h2>
  ${actionItemsHtml}
  <h2>Participants</h2>
  <p>${a.participants.length ? a.participants.map(p => esc(p)).join(", ") : "—"}</p>
  <h2>Topics Discussed</h2>
  <p>${a.topics_discussed.length ? a.topics_discussed.map(t => esc(t)).join(", ") : "—"}</p>
  ${a.next_meeting ? `<h2>Next Meeting</h2><p>${esc(a.next_meeting)}</p>` : ""}
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) {
    toast.error("Popup blocked. Allow popups for this site to print.");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 250);
}
