import React, { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { UploadZone } from "@/components/upload/UploadZone";
import { AnalysisResult } from "@/components/analysis/AnalysisResult";
import { useQuery } from "@tanstack/react-query";
import { fetchAnalysis } from "@/lib/api";
import type { Analysis } from "@/types";

const App: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
  const [viewMode, setViewMode] = useState<"upload" | "result">("upload");

  const { data: fetchedAnalysis } = useQuery<Analysis, Error>({
    queryKey: ["analysis", selectedId],
    queryFn: () => fetchAnalysis(selectedId!),
    enabled: !!selectedId,
  });

  const displayedAnalysis = selectedId ? (fetchedAnalysis ?? null) : currentAnalysis;

  const handleNewAnalysis = () => {
    setSelectedId(null);
    setCurrentAnalysis(null);
    setViewMode("upload");
  };

  const handleSelectAnalysis = (id: string | null) => {
    setSelectedId(id);
    if (id) setViewMode("result");
  };

  const handleAnalysisComplete = (analysis: Analysis) => {
    setCurrentAnalysis(analysis);
    setSelectedId(null);
    setViewMode("result");
  };

  return (
    <MainLayout
      selectedId={selectedId ?? currentAnalysis?.id ?? null}
      onSelectAnalysis={handleSelectAnalysis}
      onNewAnalysis={handleNewAnalysis}
      currentAnalysis={currentAnalysis}
    >
      {viewMode === "upload" || !displayedAnalysis ? (
        <UploadZone onAnalysisComplete={handleAnalysisComplete} />
      ) : (
        <AnalysisResult analysis={displayedAnalysis} />
      )}
    </MainLayout>
  );
};

export default App;
