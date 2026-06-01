import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { analyzeText } from "@/lib/api";
import type { Analysis, AnalyzeRequest } from "@/types";

export function useAnalysis() {
  const queryClient = useQueryClient();
  const abortRef = useRef<AbortController | null>(null);

  const mutation = useMutation<Analysis, Error, AnalyzeRequest>({
    mutationFn: (request) => {
      abortRef.current = new AbortController();
      return analyzeText(request, abortRef.current.signal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });

  const cancel = () => {
    abortRef.current?.abort();
    mutation.reset();
  };

  return { ...mutation, cancel };
}
