// 서버 시작 시 스케줄러 초기화
import { startReminderScheduler } from "./reminder-scheduler";

// 스케줄러가 이미 시작되었는지 확인
let schedulerStarted = false;

export function initScheduler() {
  if (schedulerStarted) {
    return;
  }

  // 서버 환경에서만 실행
  if (typeof window === "undefined") {
    startReminderScheduler();
    schedulerStarted = true;
  }
}

// 모듈 로드 시 자동 초기화 (서버 사이드에서만)
if (typeof window === "undefined") {
  initScheduler();
}

