import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchHistory, deleteAnalysis } from "@/lib/api";
import type { HistoryListResponse } from "@/types";

export function useHistory(page = 1, limit = 20) {
  return useQuery<HistoryListResponse, Error>({
    queryKey: ["history", page, limit],
    queryFn: () => fetchHistory(page, limit),
  });
}

export function useDeleteAnalysis() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteAnalysis,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });
}
