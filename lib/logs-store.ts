// 로그 데이터 저장소 (파일 시스템 기반 - 영구 저장)
import fs from "fs";
import path from "path";

interface LogEntry {
  id: string;
  timestamp: Date;
  type: "error" | "warning" | "info" | "debug";
  level: string;
  message: string;
  details?: string;
  responseTime?: number;
  errorCode?: string;
  file?: string;
}

// 로그 파일 경로
const LOGS_FILE_PATH = path.join(process.cwd(), "data", "logs.json");

// 로그 파일이 없으면 생성
function ensureLogsFile() {
  const dir = path.dirname(LOGS_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(LOGS_FILE_PATH)) {
    fs.writeFileSync(LOGS_FILE_PATH, JSON.stringify([], null, 2), "utf-8");
  }
}

// 로그 파일 읽기
function loadLogs(): LogEntry[] {
  try {
    ensureLogsFile();
    const content = fs.readFileSync(LOGS_FILE_PATH, "utf-8");
    const logs = JSON.parse(content);
    // 날짜 문자열을 Date 객체로 변환
    return logs.map((log: any) => ({
      ...log,
      timestamp: new Date(log.timestamp),
    }));
  } catch (error) {
    console.error("로그 파일 읽기 오류:", error);
    return [];
  }
}

// 로그 파일 저장
function saveLogs(logs: LogEntry[]): void {
  try {
    ensureLogsFile();
    // Date 객체를 문자열로 변환하여 저장
    const logsToSave = logs.map((log) => ({
      ...log,
      timestamp: log.timestamp.toISOString(),
    }));
    fs.writeFileSync(LOGS_FILE_PATH, JSON.stringify(logsToSave, null, 2), "utf-8");
  } catch (error) {
    console.error("로그 파일 저장 오류:", error);
  }
}

// 로그 추가
export function addLog(entry: Omit<LogEntry, "id">): LogEntry {
  const logs = loadLogs();
  const newEntry: LogEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
  };
  logs.push(newEntry);
  saveLogs(logs);
  return newEntry;
}

// 여러 로그 추가
export function addLogs(entries: Omit<LogEntry, "id">[]): LogEntry[] {
  const logs = loadLogs();
  const newEntries = entries.map((entry) => ({
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
  }));
  logs.push(...newEntries);
  saveLogs(logs);
  return newEntries;
}

// 로그 조회 (필터링 지원)
export function getLogs(filters?: {
  startDate?: string;
  endDate?: string;
  logType?: string;
  keyword?: string;
}): LogEntry[] {
  let filtered = loadLogs();

  if (filters?.startDate) {
    const start = new Date(filters.startDate);
    filtered = filtered.filter((log) => log.timestamp >= start);
  }

  if (filters?.endDate) {
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999); // 하루 끝까지
    filtered = filtered.filter((log) => log.timestamp <= end);
  }

  if (filters?.logType) {
    filtered = filtered.filter((log) => log.type === filters.logType);
  }

  if (filters?.keyword) {
    const keyword = filters.keyword.toLowerCase();
    filtered = filtered.filter(
      (log) =>
        log.message.toLowerCase().includes(keyword) ||
        log.details?.toLowerCase().includes(keyword) ||
        log.errorCode?.toLowerCase().includes(keyword)
    );
  }

  return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// 통계 계산
export function getStats(filters?: {
  startDate?: string;
  endDate?: string;
  logType?: string;
  keyword?: string;
}) {
  const logs = getLogs(filters);

  // 디버깅: 로그 개수와 타임스탬프 확인
  console.log("📊 getStats 호출:", {
    totalLogs: logs.length,
    sampleTimestamps: logs.slice(0, 5).map((log) => ({
      date: log.timestamp.toISOString().split("T")[0],
      type: log.type,
    })),
  });

  // 에러 타입별 통계
  // 에러 코드가 없어도 메시지에서 에러 타입 추출
  const errorTypes: Record<string, number> = {};
  logs.forEach((log) => {
    if (log.type === "error") {
      if (log.errorCode) {
        // 에러 코드가 있으면 사용
        errorTypes[log.errorCode] = (errorTypes[log.errorCode] || 0) + 1;
      } else {
        // 에러 코드가 없으면 메시지에서 추출 시도
        const errorPattern = /(?:error|exception|failed|failure)\s*[:\-]?\s*([^:\n]+)/i.exec(log.message);
        if (errorPattern) {
          const errorType = errorPattern[1].trim().substring(0, 30); // 처음 30자만
          errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
        } else {
          // 추출 불가능하면 "Unknown Error"로 분류
          errorTypes["Unknown Error"] = (errorTypes["Unknown Error"] || 0) + 1;
        }
      }
    }
  });

  const errorTypeData = Object.entries(errorTypes)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // 상위 10개

  // 시간별 통계 (날짜별로 그룹화)
  const timeSeriesMap: Record<string, { errors: number; warnings: number; info: number }> = {};
  
  logs.forEach((log) => {
    // 날짜 추출 (YYYY-MM-DD 형식) - 로컬 시간대 사용
    let date: string;
    try {
      if (log.timestamp instanceof Date && !isNaN(log.timestamp.getTime())) {
        // 로컬 시간대의 날짜 사용
        const year = log.timestamp.getFullYear();
        const month = String(log.timestamp.getMonth() + 1).padStart(2, "0");
        const day = String(log.timestamp.getDate()).padStart(2, "0");
        date = `${year}-${month}-${day}`;
      } else {
        // 유효하지 않은 Date 객체인 경우
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        date = `${year}-${month}-${day}`;
      }
    } catch (error) {
      // 타임스탬프 파싱 실패 시 현재 날짜 사용
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      date = `${year}-${month}-${day}`;
    }
    
    if (!timeSeriesMap[date]) {
      timeSeriesMap[date] = { errors: 0, warnings: 0, info: 0 };
    }
    
    if (log.type === "error") {
      timeSeriesMap[date].errors++;
    } else if (log.type === "warning") {
      timeSeriesMap[date].warnings++;
    } else if (log.type === "info" || log.type === "debug") {
      timeSeriesMap[date].info++;
    }
  });

  const timeSeriesData = Object.entries(timeSeriesMap)
    .map(([date, counts]) => ({
      date,
      errors: counts.errors || 0,
      warnings: counts.warnings || 0,
      info: counts.info || 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 디버깅: 시간별 데이터 확인
  console.log("📈 timeSeriesData:", {
    count: timeSeriesData.length,
    dates: timeSeriesData.map((d) => d.date),
    sample: timeSeriesData.slice(0, 3),
  });

  // 로그가 하나의 날짜에만 있어도 최소 3개 데이터 포인트 생성 (시각화 개선)
  // 단, 실제 데이터가 있을 때만
  if (timeSeriesData.length === 1 && logs.length > 0) {
    const singleDate = timeSeriesData[0];
        // 전날 데이터 추가 (0으로) - 그래프가 하나의 점만 있으면 안 보일 수 있음
        const prevDate = new Date(singleDate.date);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevYear = prevDate.getFullYear();
        const prevMonth = String(prevDate.getMonth() + 1).padStart(2, "0");
        const prevDay = String(prevDate.getDate()).padStart(2, "0");
        timeSeriesData.unshift({
          date: `${prevYear}-${prevMonth}-${prevDay}`,
          errors: 0,
          warnings: 0,
          info: 0,
        });
        // 다음날 데이터도 추가 (그래프 범위 확장)
        const nextDate = new Date(singleDate.date);
        nextDate.setDate(nextDate.getDate() + 1);
        const nextYear = nextDate.getFullYear();
        const nextMonth = String(nextDate.getMonth() + 1).padStart(2, "0");
        const nextDay = String(nextDate.getDate()).padStart(2, "0");
        timeSeriesData.push({
          date: `${nextYear}-${nextMonth}-${nextDay}`,
          errors: 0,
          warnings: 0,
          info: 0,
        });
    // 다시 정렬
    timeSeriesData.sort((a, b) => a.date.localeCompare(b.date));
    
    console.log("✅ 단일 날짜 데이터 확장:", {
      original: singleDate.date,
      expanded: timeSeriesData.map((d) => d.date),
    });
  }

        // 데이터가 하나도 없을 때 최소한의 데이터 포인트 생성 (테스트용)
        if (timeSeriesData.length === 0 && logs.length > 0) {
          const now = new Date();
          const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          
          const todayYear = now.getFullYear();
          const todayMonth = String(now.getMonth() + 1).padStart(2, "0");
          const todayDay = String(now.getDate()).padStart(2, "0");
          const today = `${todayYear}-${todayMonth}-${todayDay}`;
          
          const yesterdayYear = yesterdayDate.getFullYear();
          const yesterdayMonth = String(yesterdayDate.getMonth() + 1).padStart(2, "0");
          const yesterdayDay = String(yesterdayDate.getDate()).padStart(2, "0");
          const yesterday = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay}`;
          
          const tomorrowYear = tomorrowDate.getFullYear();
          const tomorrowMonth = String(tomorrowDate.getMonth() + 1).padStart(2, "0");
          const tomorrowDay = String(tomorrowDate.getDate()).padStart(2, "0");
          const tomorrow = `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}`;
    
    // 오늘 날짜로 모든 로그 집계
    const todayCounts = { errors: 0, warnings: 0, info: 0 };
    logs.forEach((log) => {
      if (log.type === "error") todayCounts.errors++;
      else if (log.type === "warning") todayCounts.warnings++;
      else if (log.type === "info" || log.type === "debug") todayCounts.info++;
    });
    
    timeSeriesData.push(
      { date: yesterday, errors: 0, warnings: 0, info: 0 },
      { date: today, ...todayCounts },
      { date: tomorrow, errors: 0, warnings: 0, info: 0 }
    );
    
    console.log("⚠️ 시간별 데이터 없음, 오늘 날짜로 집계:", timeSeriesData);
  }

  // 응답 시간 통계
  const responseTimes = logs
    .map((log) => log.responseTime)
    .filter((time): time is number => time !== undefined);

  const responseTimeStats = {
    average: responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0,
    max: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
    min: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
  };

  return {
    errorTypes: errorTypeData,
    timeSeries: timeSeriesData,
    responseTime: responseTimeStats,
    totalLogs: logs.length,
  };
}

// 모든 로그 조회
export function getAllLogs(): LogEntry[] {
  return loadLogs();
}

// 로그 삭제 (선택사항 - 관리 기능)
export function clearLogs(): void {
  ensureLogsFile();
  fs.writeFileSync(LOGS_FILE_PATH, JSON.stringify([], null, 2), "utf-8");
}
