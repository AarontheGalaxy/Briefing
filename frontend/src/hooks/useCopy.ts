import { useState, useCallback, useRef, useEffect } from "react";

export function useCopy(timeoutMs = 1500) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const copy = useCallback(async (text: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    // navigator.clipboard requires a secure context (HTTPS or localhost)
    if (!navigator.clipboard) {
      // Fallback for non-secure contexts
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        timerRef.current = setTimeout(() => setCopied(false), timeoutMs);
      } catch {
        // copy not supported in this environment
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      timerRef.current = setTimeout(() => setCopied(false), timeoutMs);
    } catch {
      // clipboard access denied
    }
  }, [timeoutMs]);

  return { copied, copy };
}
