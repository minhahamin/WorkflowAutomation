"use client";

import { Component, ErrorInfo, ReactNode, useState } from "react";
import { logError } from "@/lib/logger";
import Link from "next/link";

// React 에러 테스트를 위한 별도의 에러 바운더리
// 페이지 전체를 에러 페이지로 만들지 않고 해당 영역만 에러 표시
class TestErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError("React Component Error (Test)", error);
    
    if (typeof window !== "undefined") {
      const { logger } = require("@/lib/logger");
      if (logger) {
        logger.error({
          message: `React Error (Test): ${error.message}`,
          details: `Component Stack: ${errorInfo.componentStack}`,
          stack: error.stack,
        });
      }
    }

    console.error("React Test Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-900">
                ✅ React 에러 테스트 성공!
              </h3>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-red-800 mb-4">
              에러 바운더리가 에러를 성공적으로 캐치했습니다. 
              에러가 자동으로 로그에 기록되었습니다.
            </p>
            {this.state.error && (
              <details className="mt-4">
                <summary className="text-sm font-medium text-red-700 cursor-pointer">
                  에러 상세 정보
                </summary>
                <pre className="mt-2 p-3 bg-red-100 rounded text-xs text-red-900 overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                }}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-semibold
                  hover:bg-red-700 transition-colors"
              >
                다시 테스트
              </button>
              <Link
                href="/logs"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-semibold
                  hover:bg-blue-700 transition-colors text-center"
              >
                로그 확인
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// React 에러를 발생시키는 컴포넌트
function ErrorThrower({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("React 컴포넌트 에러 테스트");
  }
  return null;
}

// React 에러 테스트 컴포넌트
export default function ReactErrorTest() {
  const [shouldThrow, setShouldThrow] = useState(false);

  const handleTest = () => {
    setShouldThrow(true);
  };

  return (
    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        ⚠️ React 에러 테스트
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        이 버튼을 클릭하면 React 컴포넌트 에러가 발생하며, 
        에러 바운더리가 이를 캐치합니다. 페이지 전체가 아닌 이 영역만 에러가 표시됩니다.
      </p>
      
      <TestErrorBoundary>
        <ErrorThrower shouldThrow={shouldThrow} />
        <button
          onClick={handleTest}
          className="bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-semibold
            hover:bg-red-800 transition-colors"
        >
          React 에러 발생 (안전 모드)
        </button>
      </TestErrorBoundary>
    </div>
  );
}

