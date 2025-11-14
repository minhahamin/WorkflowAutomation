"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface LogViewerProps {
  filters: {
    startDate: string;
    endDate: string;
    logType: string;
    keyword: string;
  };
}

export default function LogViewer({ filters }: LogViewerProps) {
  const [page, setPage] = useState(0);
  const limit = 50;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["log-list", filters, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.logType && { logType: filters.logType }),
        ...(filters.keyword && { keyword: filters.keyword }),
        limit: limit.toString(),
        offset: (page * limit).toString(),
      });

      const response = await fetch(`/api/logs/list?${params}`);
      if (!response.ok) throw new Error("로그 목록 조회 실패");
      return response.json();
    },
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const hasMore = data?.hasMore || false;
  const totalPages = Math.ceil(total / limit);

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case "error":
        return "bg-red-100 text-red-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "info":
        return "bg-blue-100 text-blue-800";
      case "debug":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return <div className="text-gray-600">로딩 중...</div>;
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">로그 항목이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">
          로그 목록 ({total}개)
        </h3>
        <button
          onClick={() => refetch()}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          🔄 새로고침
        </button>
      </div>

      {/* 로그 테이블 */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                날짜/시간
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                타입
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                레벨
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                메시지
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                에러코드
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                응답시간
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log: any) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                  <div>{log.date}</div>
                  <div className="text-xs text-gray-500">{log.time}</div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLogTypeColor(log.type)}`}>
                    {log.type.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{log.level}</td>
                <td className="px-4 py-3 text-sm text-gray-900 max-w-md truncate" title={log.message}>
                  {log.message}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {log.errorCode || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {log.responseTime ? `${log.responseTime}ms` : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이전
          </button>
          <span className="text-sm text-gray-600">
            페이지 {page + 1} / {totalPages} (전체 {total}개)
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

