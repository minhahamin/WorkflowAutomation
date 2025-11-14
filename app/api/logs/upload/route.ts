import { NextRequest, NextResponse } from "next/server";
import { addLogs } from "@/lib/logs-store";

// 로그 파싱 함수 (다양한 로그 형식 지원)
function parseLogLine(line: string): {
  timestamp: Date;
  type: "error" | "warning" | "info" | "debug";
  level: string;
  message: string;
  details?: string;
  responseTime?: number;
  errorCode?: string;
} | null {
  if (!line || line.trim().length === 0) return null;

  const trimmed = line.trim();

  // 형식 1: [YYYY-MM-DD HH:MM:SS] LEVEL: Message
  // 예: [2025-11-15 12:00:00] ERROR: Connection failed
  const format1 = /^\[(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2})\]\s+(\w+):\s+(.+)$/i.exec(trimmed);
  if (format1) {
    const [, timestampStr, level, message] = format1;
    const timestamp = new Date(timestampStr.replace(" ", "T"));
    const type = parseLogType(level);
    const errorCode = extractErrorCode(message);
    const responseTime = extractResponseTime(message);

    return {
      timestamp,
      type,
      level: level.toUpperCase(),
      message,
      errorCode,
      responseTime,
    };
  }

  // 형식 2: YYYY-MM-DD HH:MM:SS - LEVEL - Message
  const format2 = /^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2})\s+-\s+(\w+)\s+-\s+(.+)$/i.exec(trimmed);
  if (format2) {
    const [, timestampStr, level, message] = format2;
    const timestamp = new Date(timestampStr.replace(" ", "T"));
    const type = parseLogType(level);

    return {
      timestamp,
      type,
      level: level.toUpperCase(),
      message,
      errorCode: extractErrorCode(message),
      responseTime: extractResponseTime(message),
    };
  }

  // 형식 3: LEVEL: Message (타임스탬프 없음)
  const format3 = /^(\w+):\s+(.+)$/i.exec(trimmed);
  if (format3) {
    const [, level, message] = format3;
    const type = parseLogType(level);

    return {
      timestamp: new Date(), // 현재 시간 사용
      type,
      level: level.toUpperCase(),
      message,
      errorCode: extractErrorCode(message),
      responseTime: extractResponseTime(message),
    };
  }

  // 형식 4: 단순 텍스트 (타임스탬프와 레벨 추정)
  // 에러 키워드 포함 시 error로 분류
  if (
    /error|exception|failed|failure|fatal|critical/i.test(trimmed)
  ) {
    return {
      timestamp: new Date(),
      type: "error",
      level: "ERROR",
      message: trimmed,
      errorCode: extractErrorCode(trimmed),
    };
  }

  if (/warn|warning/i.test(trimmed)) {
    return {
      timestamp: new Date(),
      type: "warning",
      level: "WARNING",
      message: trimmed,
    };
  }

  // 기본적으로 info로 분류
  return {
    timestamp: new Date(),
    type: "info",
    level: "INFO",
    message: trimmed,
  };
}

function parseLogType(level: string): "error" | "warning" | "info" | "debug" {
  const upper = level.toUpperCase();
  if (upper.includes("ERROR") || upper.includes("ERR") || upper.includes("FATAL") || upper.includes("CRITICAL")) {
    return "error";
  }
  if (upper.includes("WARN")) {
    return "warning";
  }
  if (upper.includes("DEBUG")) {
    return "debug";
  }
  return "info";
}

function extractErrorCode(message: string): string | undefined {
  // HTTP 에러 코드 추출: 404, 500, 503 등
  const httpError = /\b([45]\d{2})\b/.exec(message);
  if (httpError) return httpError[1];

  // 에러 코드 패턴 추출: ERR_CODE, ErrorCode 등
  const errorCode = /\b([A-Z_]+_ERROR|ERR_[A-Z_]+|[A-Z]+Error)\b/.exec(message);
  if (errorCode) return errorCode[1];

  return undefined;
}

function extractResponseTime(message: string): number | undefined {
  // 응답 시간 추출: "took 245ms", "response time: 1200ms" 등
  const timeMatch = /(?:took|time|duration|elapsed)[:\s]+(\d+)\s*ms/i.exec(message);
  if (timeMatch) return parseInt(timeMatch[1], 10);

  const timeMatch2 = /(\d+)\s*ms\s*(?:response|time|took)/i.exec(message);
  if (timeMatch2) return parseInt(timeMatch2[1], 10);

  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "파일이 필요합니다." },
        { status: 400 }
      );
    }

    // 파일 읽기
    const fileContent = await file.text();
    const lines = fileContent.split("\n");

    // 로그 파싱
    const parsedLogs: Array<{
      timestamp: Date;
      type: "error" | "warning" | "info" | "debug";
      level: string;
      message: string;
      details?: string;
      responseTime?: number;
      errorCode?: string;
    }> = [];

    // 타임스탬프가 없는 로그를 위한 기준 시간 (파일 업로드 시간)
    const baseTime = new Date();
    let lineCounter = 0; // 타임스탬프가 없을 때 순차적으로 시간 할당

    lines.forEach((line, index) => {
      const parsed = parseLogLine(line);
      if (parsed) {
        // 타임스탬프가 현재 시간이면 (파싱 실패로 현재 시간 사용한 경우) 순차적으로 시간 할당
        if (parsed.timestamp.getTime() === new Date().getTime() && lineCounter > 0) {
          // 이전 로그와 같은 시간이면 순차적으로 시간 증가 (1초씩)
          const previousTime = parsedLogs[parsedLogs.length - 1]?.timestamp || baseTime;
          parsed.timestamp = new Date(previousTime.getTime() + lineCounter * 1000);
        }
        parsedLogs.push(parsed);
        lineCounter++;
      }
    });

    if (parsedLogs.length === 0) {
      return NextResponse.json(
        { error: "로그 파일에서 파싱 가능한 데이터를 찾을 수 없습니다." },
        { status: 400 }
      );
    }

    // 로그 저장
    const savedLogs = addLogs(parsedLogs);

    console.log(`✅ ${savedLogs.length}개의 로그 항목이 저장되었습니다.`);

    return NextResponse.json({
      success: true,
      message: `${savedLogs.length}개의 로그 항목이 업로드되었습니다.`,
      stats: {
        total: savedLogs.length,
        errors: savedLogs.filter((l) => l.type === "error").length,
        warnings: savedLogs.filter((l) => l.type === "warning").length,
        info: savedLogs.filter((l) => l.type === "info" || l.type === "debug").length,
      },
    });
  } catch (error) {
    console.error("로그 업로드 오류:", error);
    return NextResponse.json(
      {
        error: "로그 업로드 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

