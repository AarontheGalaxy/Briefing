import { useMutation, useQueryClient } from "@tanstack/react-query";
import { analyzeText } from "@/lib/api";
import type { Analysis, AnalyzeRequest } from "@/types";

export function useAnalysis() {
  const queryClient = useQueryClient();

  return useMutation<Analysis, Error, AnalyzeRequest>({
    mutationFn: analyzeText,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });
}
