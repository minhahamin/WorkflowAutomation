"use client";

import { useEffect } from "react";

// 스케줄러는 서버 사이드에서만 실행되므로 클라이언트 컴포넌트는 필요 없음
// 하지만 서버 사이드에서 초기화하기 위해 별도 파일로 분리
export default function ReminderSchedulerInit() {
  // 클라이언트에서는 아무것도 하지 않음
  return null;
}

