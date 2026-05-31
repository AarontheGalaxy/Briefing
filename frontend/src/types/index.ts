export interface ActionItem {
  task: string;
  assignee: string | null;
  due_date: string | null;
  priority: "high" | "medium" | "low";
}

export interface Analysis {
  id: string;
  summary: string;
  key_decisions: string[];
  action_items: ActionItem[];
  participants: string[];
  topics_discussed: string[];
  next_meeting: string | null;
  sentiment: "positive" | "neutral" | "negative";
  created_at: string;
  word_count: number;
  processing_time_ms: number;
  file_name?: string | null;
  provider?: string | null;
  model?: string | null;
  completed_items?: number[];
  tags?: string[];
}

export interface UploadResponse {
  text: string;
  word_count: number;
  file_name: string;
}

export type MeetingType = "general" | "sales" | "one_on_one" | "sprint_review" | "board";

export interface AnalyzeRequest {
  text: string;
  provider: string;
  model: string;
  api_key: string | null;
  meeting_type: MeetingType;
}

export interface HistoryListResponse {
  items: Analysis[];
  total: number;
  page: number;
  limit: number;
}

export type Provider = "ollama" | "openai" | "anthropic";

export interface SettingsState {
  provider: Provider;
  model: string;
  apiKey: string;
  ollamaUrl: string;
}
