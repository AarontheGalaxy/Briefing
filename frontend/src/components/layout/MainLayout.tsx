import React from "react";
import { Sidebar } from "./Sidebar";
import type { Analysis } from "@/types";

interface MainLayoutProps {
  children: React.ReactNode;
  selectedId: string | null;
  onSelectAnalysis: (id: string | null) => void;
  onNewAnalysis: () => void;
  currentAnalysis: Analysis | null;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  selectedId,
  onSelectAnalysis,
  onNewAnalysis,
  currentAnalysis,
}) => {
  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <Sidebar
        selectedId={selectedId}
        onSelectAnalysis={onSelectAnalysis}
        onNewAnalysis={onNewAnalysis}
        currentAnalysis={currentAnalysis}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
};
