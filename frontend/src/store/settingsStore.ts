import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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
      // sessionStorage: clears when the tab is closed, never written to disk
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        provider: state.provider,
        model: state.model,
        // apiKey intentionally excluded — not persisted anywhere
        ollamaUrl: state.ollamaUrl,
      }),
    }
  )
);
