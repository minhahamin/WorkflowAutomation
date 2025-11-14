"use client";

import { useState } from "react";

interface SummaryResultProps {
  summary: string | null;
  isProcessing: boolean;
}

export default function AISummaryResult({ summary, isProcessing }: SummaryResultProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAsPDF = async () => {
    if (!summary) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/ai/save-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `PDF 저장 실패 (${response.status})`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ai-summary-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "PDF 저장 중 오류가 발생했습니다.";
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">AI가 문서를 분석하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">요약 결과가 여기에 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">요약 결과</h3>
        <button
          onClick={handleSaveAsPDF}
          disabled={isSaving}
          className="bg-green-600 text-white py-2 px-4 rounded-lg font-semibold
            hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed
            transition-colors text-sm"
        >
          {isSaving ? "저장 중..." : "📥 PDF로 저장"}
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 max-h-[500px] overflow-y-auto">
        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-800">
          {summary}
        </div>
      </div>
    </div>
  );
}

