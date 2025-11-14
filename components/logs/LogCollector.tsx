"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

// API로 로그를 전송하는 컴포넌트 (개발/테스트용)
export default function LogCollector() {
  const [isCollecting, setIsCollecting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const collectSampleLogs = async () => {
    setIsCollecting(true);
    setMessage(null);

    try {
      // 샘플 로그 데이터 생성
      const sampleLogs = [
        {
          timestamp: new Date().toISOString(),
          type: "error",
          level: "ERROR",
          message: "404 Not Found - /api/users/999",
          errorCode: "404",
        },
        {
          timestamp: new Date().toISOString(),
          type: "warning",
          level: "WARNING",
          message: "Slow query detected - took 1200ms",
          responseTime: 1200,
        },
        {
          timestamp: new Date().toISOString(),
          type: "info",
          level: "INFO",
          message: "User logged in - user_id: 123",
          responseTime: 245,
        },
        {
          timestamp: new Date().toISOString(),
          type: "error",
          level: "ERROR",
          message: "500 Internal Server Error - Database connection failed",
          errorCode: "500",
        },
        {
          timestamp: new Date().toISOString(),
          type: "info",
          level: "INFO",
          message: "Cache cleared - cache_key: user_123",
        },
      ];

      const response = await fetch("/api/logs/collect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sampleLogs),
      });

      if (!response.ok) {
        throw new Error("로그 수집 실패");
      }

      const result = await response.json();
      setMessage(`✅ ${result.savedCount}개의 로그가 실제로 저장되었습니다. (차트와 로그 목록에서 확인 가능)`);

      // React Query 캐시 무효화
      await queryClient.invalidateQueries({ queryKey: ["log-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["log-list"] });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "로그 수집 중 오류가 발생했습니다.");
    } finally {
      setIsCollecting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          📡 API로 로그 전송
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          API 엔드포인트로 로그를 전송하여 자동으로 수집할 수 있습니다.
          <br />
          <span className="text-red-600 font-semibold">⚠️ 주의: 샘플 로그도 실제로 저장되며 차트에 표시됩니다!</span>
        </p>

        <div className="space-y-2">
          <button
            onClick={collectSampleLogs}
            disabled={isCollecting}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold
              hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
              transition-colors"
          >
            {isCollecting ? "수집 중..." : "🧪 샘플 로그 수집"}
          </button>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes("✅") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            }`}>
              {message}
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-mono text-gray-700">
            <strong>API 엔드포인트:</strong> POST /api/logs/collect
          </p>
          <p className="text-xs text-gray-600 mt-2">
            애플리케이션에서 이 엔드포인트로 로그를 전송하면 자동으로 수집됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}

