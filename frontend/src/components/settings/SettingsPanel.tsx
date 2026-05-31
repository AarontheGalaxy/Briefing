import React, { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchModels, testConnection, getWebhook, setWebhook } from "@/lib/api";
import { useSettingsStore } from "@/store/settingsStore";
import { cn } from "@/lib/utils";
import type { Provider } from "@/types";
import { toast } from "sonner";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

const PROVIDERS: { id: Provider; label: string }[] = [
  { id: "ollama", label: "Ollama (Local)" },
  { id: "openai", label: "OpenAI" },
  { id: "anthropic", label: "Anthropic" },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ open, onClose }) => {
  const { provider, model, apiKey, ollamaUrl, setProvider, setModel, setApiKey, setOllamaUrl } =
    useSettingsStore();
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [webhookInput, setWebhookInput] = useState("");
  const queryClient = useQueryClient();

  const { data: models = [] } = useQuery({
    queryKey: ["models", provider],
    queryFn: () => fetchModels(provider),
    enabled: open,
    staleTime: 30_000,
  });

  const { data: webhookData } = useQuery({
    queryKey: ["webhook"],
    queryFn: getWebhook,
    enabled: open,
    onSuccess: (d: { url: string | null }) => setWebhookInput(d.url ?? ""),
  });

  const webhookMutation = useMutation({
    mutationFn: (url: string | null) => setWebhook(url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhook"] });
      toast.success("Webhook saved.");
    },
    onError: () => toast.error("Failed to save webhook."),
  });

  const handleProviderChange = (p: Provider) => {
    setProvider(p);
    const defaults: Record<Provider, string> = {
      ollama: "llama3.1",
      openai: "gpt-4o-mini",
      anthropic: "claude-3-5-haiku-20241022",
    };
    setModel(defaults[p]);
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await testConnection({
        provider,
        model,
        api_key: apiKey || null,
        ollama_url: provider === "ollama" ? ollamaUrl : null,
      });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Connection test failed.");
    } finally {
      setTesting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative ml-auto w-80 h-full bg-zinc-900 border-l border-zinc-800 flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
          <span className="text-sm font-medium text-zinc-100">Settings</span>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              LLM Provider
            </label>
            <div className="space-y-1.5">
              {PROVIDERS.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="provider"
                    value={p.id}
                    checked={provider === p.id}
                    onChange={() => handleProviderChange(p.id)}
                    className="accent-blue-500"
                  />
                  <span
                    className={cn(
                      "text-sm transition-colors",
                      provider === p.id ? "text-zinc-100" : "text-zinc-400 group-hover:text-zinc-300"
                    )}
                  >
                    {p.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-sm rounded px-2 py-1.5 focus:outline-none focus:border-zinc-700"
            >
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
              {!models.includes(model) && <option value={model}>{model}</option>}
            </select>
          </div>

          {provider !== "ollama" && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-sm rounded px-2 py-1.5 pr-8 focus:outline-none focus:border-zinc-700 font-mono"
                />
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                  onClick={() => setShowKey((v) => !v)}
                  type="button"
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-xs text-zinc-600">Kept in memory for this session only — cleared when you close the tab.</p>
            </div>
          )}

          {provider === "ollama" && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Ollama URL
              </label>
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-sm rounded px-2 py-1.5 focus:outline-none focus:border-zinc-700 font-mono"
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Webhook URL
            </label>
            <input
              type="url"
              value={webhookInput}
              onChange={(e) => setWebhookInput(e.target.value)}
              placeholder="https://your-server.com/webhook"
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-sm rounded px-2 py-1.5 focus:outline-none focus:border-zinc-700 font-mono"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-600">
                POST'd after every analysis completes.
              </p>
              <button
                onClick={() => webhookMutation.mutate(webhookInput.trim() || null)}
                disabled={webhookMutation.isPending}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-800 p-4">
          <button
            onClick={handleTest}
            disabled={testing}
            className="w-full px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm rounded border border-zinc-700 transition-colors disabled:opacity-50"
          >
            {testing ? "Testing..." : "Test Connection"}
          </button>
        </div>
      </div>
    </div>
  );
};
