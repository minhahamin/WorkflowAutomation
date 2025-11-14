"use client";

import { useEffect } from "react";
import "@/lib/logger"; // logger 초기화 (전역 에러 핸들러 설정)

// 전역 에러 핸들러를 확실히 초기화하는 컴포넌트
// app/layout.tsx에 추가하여 모든 페이지에서 작동하도록 보장
export default function LoggerInit() {
  useEffect(() => {
    // logger가 이미 초기화되었는지 확인
    // lib/logger.ts에서 싱글톤 인스턴스가 생성되면서
    // setupGlobalErrorHandlers()가 자동으로 호출됨
    
    console.log("✅ 전역 에러 로거가 초기화되었습니다. 모든 페이지에서 에러가 자동으로 수집됩니다.");
    
    // 테스트: 전역 에러 핸들러가 작동하는지 확인
    if (typeof window !== "undefined") {
      // window.onerror가 설정되었는지 확인 (디버깅용)
      const originalOnError = window.onerror;
      console.log("전역 에러 핸들러 상태:", originalOnError ? "활성화됨" : "기본값");
    }
  }, []);

  // 이 컴포넌트는 렌더링하지 않음 (초기화만 수행)
  return null;
}

