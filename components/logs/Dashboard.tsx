"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DashboardProps {
  filters: {
    startDate: string;
    endDate: string;
    logType: string;
    keyword: string;
  };
}

export default function LogDashboard({ filters }: DashboardProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["log-stats", filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.logType && { logType: filters.logType }),
        ...(filters.keyword && { keyword: filters.keyword }),
      });

      const response = await fetch(`/api/logs/stats?${params}`);
      if (!response.ok) throw new Error("통계 조회 실패");
      return response.json();
    },
  });

  if (isLoading) {
    return <div className="text-gray-600">로딩 중...</div>;
  }

  // 샘플 데이터 (실제 API 응답 대체)
  const errorTypeData = stats?.errorTypes || [
    { type: "404", count: 45 },
    { type: "500", count: 23 },
    { type: "Timeout", count: 12 },
    { type: "DB Error", count: 8 },
  ];

  const timeSeriesData = stats?.timeSeries || [
    { date: "2024-01-01", errors: 10, warnings: 15, info: 50 },
    { date: "2024-01-02", errors: 8, warnings: 12, info: 45 },
    { date: "2024-01-03", errors: 15, warnings: 20, info: 60 },
    { date: "2024-01-04", errors: 12, warnings: 18, info: 55 },
  ];

  const responseTimeStats = stats?.responseTime || {
    average: 245,
    max: 1200,
    min: 50,
  };

  const handleDownloadCSV = async () => {
    const params = new URLSearchParams({
      ...(filters.startDate && { startDate: filters.startDate }),
      ...(filters.endDate && { endDate: filters.endDate }),
      ...(filters.logType && { logType: filters.logType }),
      ...(filters.keyword && { keyword: filters.keyword }),
    });

    const response = await fetch(`/api/logs/export?${params}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `logs-${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">통계 대시보드</h2>
        <button
          onClick={handleDownloadCSV}
          className="bg-green-600 text-white py-2 px-4 rounded-lg font-semibold
            hover:bg-green-700 transition-colors"
        >
          📥 CSV 다운로드
        </button>
      </div>

      {/* 응답 시간 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">평균 응답시간</p>
          <p className="text-2xl font-bold text-blue-900">{responseTimeStats.average}ms</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-red-600 font-medium">최대 응답시간</p>
          <p className="text-2xl font-bold text-red-900">{responseTimeStats.max}ms</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600 font-medium">최소 응답시간</p>
          <p className="text-2xl font-bold text-green-900">{responseTimeStats.min}ms</p>
        </div>
      </div>

      {/* 에러 타입 통계 */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">에러 타입별 통계</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={errorTypeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 시간별 로그 추이 */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">시간별 로그 추이</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} />
            <Line type="monotone" dataKey="warnings" stroke="#f59e0b" strokeWidth={2} />
            <Line type="monotone" dataKey="info" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

