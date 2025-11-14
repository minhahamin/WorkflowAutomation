"use client";

import { useState } from "react";
import { logError, logWarning, logInfo, logger } from "@/lib/logger";
import { useQueryClient } from "@tanstack/react-query";
import ReactErrorTest from "./ReactErrorTest";
import APITestButton from "./APITestButton";

// 실제 에러 로그 테스트 컴포넌트
export default function LogTestButtons() {
  const [message, setMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleSuccess = async (msg: string) => {
    setMessage(`✅ ${msg}`);
    // React Query 캐시 무효화하여 차트 업데이트
    await queryClient.invalidateQueries({ queryKey: ["log-stats"] });
    await queryClient.invalidateQueries({ queryKey: ["log-list"] });
    setTimeout(() => setMessage(null), 3000);
  };

  // JavaScript 에러 발생 테스트
  const testJavaScriptError = () => {
    try {
      // 의도적으로 에러 발생
      // @ts-ignore
      undefinedFunction();
    } catch (error) {
      logError("JavaScript 에러 테스트", error);
      handleSuccess("JavaScript 에러가 로그에 기록되었습니다!");
    }
  };

  // API 에러 테스트
  const testAPIError = async () => {
    try {
      // 404 에러 발생
      const response = await fetch("/api/nonexistent-endpoint");
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
    } catch (error) {
      logError("API 에러 테스트", error);
      handleSuccess("API 에러가 자동으로 로그에 기록되었습니다!");
    }
  };

  // 네트워크 에러 테스트
  const testNetworkError = async () => {
    try {
      await fetch("https://nonexistent-domain-12345.com/api/test");
    } catch (error) {
      logError("네트워크 에러 테스트", error);
      handleSuccess("네트워크 에러가 자동으로 로그에 기록되었습니다!");
    }
  };

  // 경고 로그 테스트
  const testWarning = () => {
    logWarning("느린 응답 경고", "API 응답 시간이 2초를 초과했습니다.");
    handleSuccess("경고 로그가 기록되었습니다!");
  };

  // 정보 로그 테스트
  const testInfo = () => {
    logInfo("사용자 로그인", "user_id: 123, ip: 192.168.1.1");
    handleSuccess("정보 로그가 기록되었습니다!");
  };

  // React 에러 테스트는 별도 컴포넌트로 분리

  // 즉시 전송 테스트
  const testImmediateSend = async () => {
    if (logger) {
      await logger.sendImmediate({
        message: "즉시 전송 테스트 로그",
        details: "이 로그는 배치 대기 없이 즉시 전송됩니다.",
      }, "error");
      handleSuccess("즉시 전송 로그가 기록되었습니다!");
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          🧪 실제 에러 로그 테스트
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          아래 버튼들을 클릭하여 실제 에러를 발생시키고 자동 로그 수집을 테스트할 수 있습니다.
        </p>

        {message && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-800 text-sm">
            {message}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <button
            onClick={testJavaScriptError}
            className="bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-semibold
              hover:bg-red-700 transition-colors"
          >
            JavaScript 에러
          </button>

          <button
            onClick={testAPIError}
            className="bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-semibold
              hover:bg-red-700 transition-colors"
          >
            API 에러 (404)
          </button>

          <button
            onClick={testNetworkError}
            className="bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-semibold
              hover:bg-red-700 transition-colors"
          >
            네트워크 에러
          </button>

          <button
            onClick={testWarning}
            className="bg-yellow-600 text-white py-2 px-4 rounded-lg text-sm font-semibold
              hover:bg-yellow-700 transition-colors"
          >
            경고 로그
          </button>

          <button
            onClick={testInfo}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-semibold
              hover:bg-blue-700 transition-colors"
          >
            정보 로그
          </button>

          <button
            onClick={testImmediateSend}
            className="bg-purple-600 text-white py-2 px-4 rounded-lg text-sm font-semibold
              hover:bg-purple-700 transition-colors"
          >
            즉시 전송
          </button>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-2">
            <strong>참고:</strong>
          </p>
          <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
            <li>JavaScript/API/네트워크 에러는 자동으로 캐치되어 로그에 기록됩니다.</li>
            <li>로그는 배치 처리되어 5초마다 또는 10개씩 전송됩니다.</li>
            <li>차트와 로그 목록에서 확인할 수 있습니다.</li>
          </ul>
        </div>
      </div>

      {/* API 에러 테스트 (400, 500 등) */}
      <APITestButton />

      {/* React 에러 테스트 (안전한 버전 - 별도 에러 바운더리 사용) */}
      <ReactErrorTest />
    </div>
  );
}

