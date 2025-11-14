"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

// API 400 에러 테스트 컴포넌트
export default function APITestButton() {
  const [message, setMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleSuccess = async (msg: string) => {
    setMessage(`✅ ${msg}`);
    // React Query 캐시 무효화하여 차트 업데이트
    await queryClient.invalidateQueries({ queryKey: ["log-stats"] });
    await queryClient.invalidateQueries({ queryKey: ["log-list"] });
    setTimeout(() => setMessage(null), 5000);
  };

  // API 400 에러 테스트
  const testAPI400Error = async () => {
    try {
      // 실제로 400 에러를 발생시키는 요청
      const response = await fetch("/api/reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}), // 빈 데이터로 400 에러 발생
      });

      // 응답이 있으면 에러 로그가 자동으로 기록됨 (fetch 인터셉터)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        handleSuccess(
          `400 에러가 발생했습니다. 이제 /logs 페이지에서 에러 로그를 확인하세요! (에러 코드: ${response.status})`
        );
      }
    } catch (error) {
      // 네트워크 에러도 자동으로 기록됨
      handleSuccess("네트워크 에러가 발생했습니다. 로그에 기록되었습니다!");
    }
  };

  // API 500 에러 테스트
  const testAPI500Error = async () => {
    try {
      const response = await fetch("/api/test-500", {
        method: "GET",
      });

      if (!response.ok) {
        handleSuccess(
          `500 에러가 발생했습니다. 로그에 기록되었습니다! (에러 코드: ${response.status})`
        );
      }
    } catch (error) {
      handleSuccess("에러가 발생했습니다. 로그에 기록되었습니다!");
    }
  };

  return (
    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        🔍 API 에러 자동 수집 테스트
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        아래 버튼을 클릭하면 API 에러(400, 500 등)가 발생하고, 
        <strong className="text-red-600"> 자동으로 로그에 기록</strong>되어 
        <strong className="text-blue-600"> 차트에 표시</strong>됩니다.
      </p>

      {message && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-800 text-sm">
          {message}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={testAPI400Error}
          className="bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-semibold
            hover:bg-red-700 transition-colors"
        >
          API 400 에러 테스트
        </button>

        <button
          onClick={testAPI500Error}
          className="bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-semibold
            hover:bg-red-800 transition-colors"
        >
          API 500 에러 테스트
        </button>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800 mb-2">
          <strong>✅ 확인 방법:</strong>
        </p>
        <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
          <li>위 버튼을 클릭하여 에러 발생</li>
          <li>5초 이내에 자동으로 로그 전송됨</li>
          <li>이 페이지 또는 /logs 페이지에서 "에러 타입별 통계" 차트 확인</li>
          <li>"로그 목록"에서 상세 정보 확인</li>
        </ol>
      </div>
    </div>
  );
}

