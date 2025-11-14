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
  const { data: stats, isLoading, refetch } = useQuery({
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
    refetchInterval: 30000, // 30초마다 자동 새로고침 (선택사항)
  });

  if (isLoading) {
    return <div className="text-gray-600">로딩 중...</div>;
  }

  // 실제 API 응답 데이터 사용
  const errorTypeData = stats?.errorTypes || [];
  const timeSeriesData = stats?.timeSeries || [];
  const responseTimeStats = stats?.responseTime || {
    average: 0,
    max: 0,
    min: 0,
  };
  const totalLogs = stats?.totalLogs || 0;

  // 디버깅: 콘솔에 데이터 확인
  console.log("📊 Dashboard Stats:", {
    stats,
    errorTypeData,
    timeSeriesData,
    responseTimeStats,
    totalLogs,
  });

  // 완전히 데이터가 없는 경우에만 메시지 표시 (로그가 0개)
  if (!isLoading && (!stats || totalLogs === 0)) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-900">통계 대시보드</h2>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">
            {stats?.message || "로그 데이터가 없습니다."}
          </p>
          <p className="text-gray-400 text-sm">
            로그 파일을 업로드하면 통계가 표시됩니다.
          </p>
        </div>
      </div>
    );
  }

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
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          에러 타입별 통계 {errorTypeData.length > 0 && `(${errorTypeData.length}개)`}
        </h3>
        {errorTypeData.length > 0 ? (
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
        ) : (
          <div className="text-center py-8 text-gray-400">
            에러 타입 데이터가 없습니다. (에러 로그가 없거나 에러 코드가 추출되지 않았습니다)
          </div>
        )}
      </div>

      {/* 시간별 로그 추이 */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          시간별 로그 추이 {timeSeriesData.length > 0 && `(${timeSeriesData.length}일)`}
        </h3>
        {timeSeriesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} name="에러" />
              <Line type="monotone" dataKey="warnings" stroke="#f59e0b" strokeWidth={2} name="경고" />
              <Line type="monotone" dataKey="info" stroke="#3b82f6" strokeWidth={2} name="정보" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-gray-400">
            시간별 추이 데이터가 없습니다.
          </div>
        )}
      </div>

      {/* 전체 로그 개수 표시 */}
      {totalLogs > 0 && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          총 {totalLogs}개의 로그 항목이 표시됩니다.
        </div>
      )}
    </div>
  );
}

