// 로그 데이터 저장소 (메모리 기반)
// 나중에 데이터베이스로 전환 가능

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

// 메모리 기반 저장소
const logsStore: LogEntry[] = [];

export function addLog(entry: Omit<LogEntry, "id">): LogEntry {
  const newEntry: LogEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
  };
  logsStore.push(newEntry);
  return newEntry;
}

export function addLogs(entries: Omit<LogEntry, "id">[]): LogEntry[] {
  const newEntries = entries.map((entry) => ({
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
  }));
  logsStore.push(...newEntries);
  return newEntries;
}

export function getLogs(filters?: {
  startDate?: string;
  endDate?: string;
  logType?: string;
  keyword?: string;
}): LogEntry[] {
  let filtered = [...logsStore];

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
    // 날짜 추출 (YYYY-MM-DD 형식)
    let date: string;
    try {
      if (log.timestamp instanceof Date && !isNaN(log.timestamp.getTime())) {
        date = log.timestamp.toISOString().split("T")[0];
      } else {
        // 유효하지 않은 Date 객체인 경우
        date = new Date().toISOString().split("T")[0];
      }
    } catch (error) {
      // 타임스탬프 파싱 실패 시 현재 날짜 사용
      date = new Date().toISOString().split("T")[0];
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
    timeSeriesData.unshift({
      date: prevDate.toISOString().split("T")[0],
      errors: 0,
      warnings: 0,
      info: 0,
    });
    // 다음날 데이터도 추가 (그래프 범위 확장)
    const nextDate = new Date(singleDate.date);
    nextDate.setDate(nextDate.getDate() + 1);
    timeSeriesData.push({
      date: nextDate.toISOString().split("T")[0],
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
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    
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

export function getAllLogs(): LogEntry[] {
  return [...logsStore];
}

