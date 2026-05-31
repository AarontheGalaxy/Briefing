import axios from "axios";
import type { Analysis, AnalyzeRequest, HistoryListResponse, UploadResponse } from "@/types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.detail ?? fallback;
  }
  return fallback;
}

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<UploadResponse>("/api/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function analyzeText(request: AnalyzeRequest): Promise<Analysis> {
  const { data } = await api.post<Analysis>("/api/analyze", request);
  return data;
}

export async function fetchHistory(page = 1, limit = 20, search = ""): Promise<HistoryListResponse> {
  const { data } = await api.get<HistoryListResponse>("/api/history", {
    params: { page, limit, ...(search ? { search } : {}) },
  });
  return data;
}

export async function fetchAnalysis(id: string): Promise<Analysis> {
  const { data } = await api.get<Analysis>(`/api/history/${id}`);
  return data;
}

export async function deleteAnalysis(id: string): Promise<void> {
  await api.delete(`/api/history/${id}`);
}

export async function fetchModels(provider: string): Promise<string[]> {
  const { data } = await api.get<{ models: string[] }>("/api/settings/models", {
    params: { provider },
  });
  return data.models;
}

export async function testConnection(payload: {
  provider: string;
  model: string;
  api_key: string | null;
  ollama_url: string | null;
}): Promise<{ success: boolean; message: string }> {
  const { data } = await api.post<{ success: boolean; message: string }>(
    "/api/settings/test",
    payload
  );
  return data;
}
