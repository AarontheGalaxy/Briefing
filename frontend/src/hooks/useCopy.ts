import { useState, useCallback } from "react";

export function useCopy(timeoutMs = 1500) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), timeoutMs);
    } catch {
      // clipboard not available (e.g. non-secure context)
    }
  }, [timeoutMs]);

  return { copied, copy };
}
