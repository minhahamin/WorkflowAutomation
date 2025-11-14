import { NextRequest, NextResponse } from "next/server";
import { addLog } from "@/lib/logs-store";

// API 엔드포인트로 로그 전송 (자동 수집)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 단일 로그 또는 로그 배열 지원
    const logs = Array.isArray(body) ? body : [body];

    const savedLogs = [];

    for (const log of logs) {
      // 필수 필드 검증
      if (!log.message) {
        continue; // 메시지가 없으면 스킵
      }

      // 타임스탬프 처리
      let timestamp: Date;
      if (log.timestamp) {
        timestamp = new Date(log.timestamp);
        if (isNaN(timestamp.getTime())) {
          timestamp = new Date(); // 유효하지 않으면 현재 시간
        }
      } else {
        timestamp = new Date(); // 타임스탬프 없으면 현재 시간
      }

      // 로그 타입 자동 분류
      let type: "error" | "warning" | "info" | "debug" = "info";
      let level = "INFO";

      if (log.type) {
        const upperType = log.type.toUpperCase();
        if (upperType === "ERROR" || upperType === "ERR" || upperType === "FATAL" || upperType === "CRITICAL") {
          type = "error";
          level = "ERROR";
        } else if (upperType === "WARN" || upperType === "WARNING") {
          type = "warning";
          level = "WARNING";
        } else if (upperType === "DEBUG") {
          type = "debug";
          level = "DEBUG";
        } else {
          type = "info";
          level = "INFO";
        }
      } else if (log.level) {
        const upperLevel = log.level.toUpperCase();
        if (upperLevel.includes("ERROR") || upperLevel.includes("ERR") || upperLevel.includes("FATAL")) {
          type = "error";
          level = upperLevel;
        } else if (upperLevel.includes("WARN")) {
          type = "warning";
          level = upperLevel;
        } else if (upperLevel.includes("DEBUG")) {
          type = "debug";
          level = upperLevel;
        } else {
          type = "info";
          level = upperLevel;
        }
      } else {
        // 메시지에서 자동 분류
        const message = log.message.toUpperCase();
        if (message.includes("ERROR") || message.includes("ERR") || message.includes("FAILED") || message.includes("FATAL")) {
          type = "error";
          level = "ERROR";
        } else if (message.includes("WARN") || message.includes("WARNING")) {
          type = "warning";
          level = "WARNING";
        }
      }

      // 에러 코드 추출 (HTTP 에러 코드 또는 커스텀 코드)
      let errorCode: string | undefined;
      if (log.errorCode) {
        errorCode = log.errorCode;
      } else if (log.message) {
        const httpError = /\b([45]\d{2})\b/.exec(log.message);
        if (httpError) {
          errorCode = httpError[1];
        }
      }

      // 응답 시간 추출
      let responseTime: number | undefined;
      if (log.responseTime !== undefined) {
        responseTime = typeof log.responseTime === "number" ? log.responseTime : parseInt(log.responseTime, 10);
      } else if (log.message) {
        const timeMatch = /(?:took|time|duration|elapsed)[:\s]+(\d+)\s*ms/i.exec(log.message);
        if (timeMatch) {
          responseTime = parseInt(timeMatch[1], 10);
        }
      }

      // 로그 저장
      const savedLog = addLog({
        timestamp,
        type,
        level: log.level || level,
        message: log.message,
        errorCode,
        responseTime,
        details: log.details || log.stack || log.exception,
        file: log.file || log.source,
      });

      savedLogs.push(savedLog);
    }

    console.log(`✅ ${savedLogs.length}개의 로그 항목이 API를 통해 수집되었습니다.`);

    return NextResponse.json({
      success: true,
      message: `${savedLogs.length}개의 로그 항목이 수집되었습니다.`,
      savedCount: savedLogs.length,
    });
  } catch (error) {
    console.error("로그 수집 오류:", error);
    return NextResponse.json(
      {
        error: "로그 수집 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

