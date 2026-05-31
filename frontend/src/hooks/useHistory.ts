import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchHistory, deleteAnalysis } from "@/lib/api";
import type { Analysis, HistoryListResponse } from "@/types";

export function useHistory(page = 1, limit = 20) {
  return useQuery<HistoryListResponse, Error>({
    queryKey: ["history", page, limit],
    queryFn: () => fetchHistory(page, limit),
  });
}

const PAGE_SIZE = 20;

export function usePaginatedHistory() {
  const [page, setPage] = useState(1);
  const [allItems, setAllItems] = useState<Analysis[]>([]);
  const [total, setTotal] = useState(0);

  const { data, isFetching } = useQuery<HistoryListResponse, Error>({
    queryKey: ["history", page, PAGE_SIZE],
    queryFn: () => fetchHistory(page, PAGE_SIZE),
  });

  useEffect(() => {
    if (!data) return;
    setTotal(data.total);
    setAllItems((prev) =>
      page === 1 ? data.items : [...prev, ...data.items]
    );
  }, [data, page]);

  const loadMore = () => setPage((p) => p + 1);
  const reset = () => { setPage(1); setAllItems([]); };
  const hasMore = allItems.length < total;

  return { allItems, total, hasMore, isFetching, loadMore, reset };
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
