"use client";

import { useState } from "react";
import Link from "next/link";
import LogDashboard from "@/components/logs/Dashboard";
import LogFilters from "@/components/logs/Filters";
import LogViewer from "@/components/logs/LogViewer";

export default function LogsPage() {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    logType: "",
    keyword: "",
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← 홈으로
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📊 로그 분석 대시보드
          </h1>
          <p className="text-gray-600">
            업로드하거나 자동 수집된 로그를 시각화하고 분석합니다.
          </p>
        </div>

        <div className="space-y-6">
          {/* 필터 영역 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <LogFilters filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* 대시보드 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <LogDashboard filters={filters} />
          </div>

          {/* 로그 목록 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              로그 목록
            </h2>
            <LogViewer filters={filters} />
          </div>

          {/* 정보 */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              ℹ️ 로그 수집 정보
            </h2>
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                <strong>✅ 자동 로그 수집:</strong> 애플리케이션에서 발생하는 모든 에러가 자동으로 수집됩니다.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>JavaScript 에러 자동 캐치</li>
                <li>API 에러 (4xx, 5xx) 자동 캐치</li>
                <li>네트워크 에러 자동 캐치</li>
                <li>React 컴포넌트 에러 자동 캐치</li>
              </ul>
              <p className="mt-3">
                <strong>📊 로그 확인:</strong> 위 대시보드와 로그 목록에서 실시간으로 확인할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

