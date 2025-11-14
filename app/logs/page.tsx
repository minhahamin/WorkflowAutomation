"use client";

import { useState } from "react";
import Link from "next/link";
import LogDashboard from "@/components/logs/Dashboard";
import LogUploadForm from "@/components/logs/UploadForm";
import LogFilters from "@/components/logs/Filters";

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

          {/* 파일 업로드 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              로그 파일 업로드
            </h2>
            <LogUploadForm />
          </div>
        </div>
      </div>
    </div>
  );
}

