import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchModels } from "@/lib/api";
import { useSettingsStore } from "@/store/settingsStore";

export const ModelSelector: React.FC = () => {
  const { provider, model, setModel } = useSettingsStore();

  const { data: models = [] } = useQuery({
    queryKey: ["models", provider],
    queryFn: () => fetchModels(provider),
    staleTime: 30_000,
  });

  return (
    <select
      value={model}
      onChange={(e) => setModel(e.target.value)}
      className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded px-2 py-1.5 focus:outline-none focus:border-zinc-700 min-w-36 transition-colors"
    >
      {models.map((m) => (
        <option key={m} value={m}>
          {m}
        </option>
      ))}
      {!models.includes(model) && (
        <option value={model}>{model}</option>
      )}
    </select>
  );
};
