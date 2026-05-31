import React, { useState, useRef } from "react";
import { X, Tag } from "lucide-react";
import { updateTags } from "@/lib/api";

interface TagEditorProps {
  analysisId: string;
  initialTags: string[];
}

export const TagEditor: React.FC<TagEditorProps> = ({ analysisId, initialTags }) => {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const persist = async (next: string[]) => {
    setTags(next);
    await updateTags(analysisId, next).catch(() => {});
  };

  const addTag = () => {
    const val = input.trim().toLowerCase().slice(0, 32);
    if (!val || tags.includes(val) || tags.length >= 20) return;
    persist([...tags, val]);
    setInput("");
  };

  const removeTag = (tag: string) => persist(tags.filter((t) => t !== tag));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1">
        <Tag className="w-3 h-3" /> Tags
      </span>
      <div
        className="flex flex-wrap gap-1.5 min-h-7 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs px-2 py-0.5 rounded-full"
          >
            {tag}
            <button
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              className="text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? "Add tags…" : ""}
          className="bg-transparent text-xs text-zinc-300 placeholder-zinc-600 outline-none min-w-16 flex-1"
          maxLength={32}
        />
      </div>
      <p className="text-xs text-zinc-600">Press Enter or comma to add · max 20 tags</p>
    </div>
  );
};
