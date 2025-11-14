"use client";

import { useState } from "react";
import Link from "next/link";
import AISummaryForm from "@/components/ai-summary/SummaryForm";
import AISummaryResult from "@/components/ai-summary/SummaryResult";

export default function AISummaryPage() {
  const [summary, setSummary] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← 홈으로
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🤖 AI 문서 요약 & 보고서 자동 생성
          </h1>
          <p className="text-gray-600">
            업로드된 문서를 AI로 자동 요약하고, 로그를 기반으로 운영 리포트를 생성합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 문서 업로드 폼 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              문서 업로드
            </h2>
            <AISummaryForm
              onSummaryGenerated={setSummary}
              onProcessingChange={setIsProcessing}
            />
          </div>

          {/* 요약 결과 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              AI 요약 결과
            </h2>
            <AISummaryResult summary={summary} isProcessing={isProcessing} />
          </div>
        </div>

        {/* 운영 리포트 자동 생성 */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            📊 운영 리포트 자동 생성
          </h2>
          <p className="text-gray-600 mb-4">
            로그 데이터를 기반으로 AI가 자동으로 운영 리포트를 생성합니다.
          </p>
          <button
            onClick={async () => {
              setIsProcessing(true);
              try {
                const response = await fetch("/api/ai/generate-report", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    endDate: new Date().toISOString(),
                  }),
                });
                const result = await response.json();
                setSummary(result.report);
              } catch (err) {
                console.error(err);
              } finally {
                setIsProcessing(false);
              }
            }}
            disabled={isProcessing}
            className="bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold
              hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed
              transition-colors"
          >
            {isProcessing ? "생성 중..." : "최근 7일 운영 리포트 생성"}
          </button>
        </div>
      </div>
    </div>
  );
}

