import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Provider, SettingsState } from "@/types";

interface SettingsStore extends SettingsState {
  setProvider: (provider: Provider) => void;
  setModel: (model: string) => void;
  setApiKey: (key: string) => void;
  setOllamaUrl: (url: string) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      provider: "ollama",
      model: "llama3.1",
      apiKey: "",
      ollamaUrl: "http://localhost:11434",
      setProvider: (provider) => set({ provider }),
      setModel: (model) => set({ model }),
      setApiKey: (apiKey) => set({ apiKey }),
      setOllamaUrl: (ollamaUrl) => set({ ollamaUrl }),
    }),
    {
      name: "briefing-settings",
      partialize: (state) => ({
        provider: state.provider,
        model: state.model,
        apiKey: state.apiKey,
        ollamaUrl: state.ollamaUrl,
      }),
    }
  )
);
