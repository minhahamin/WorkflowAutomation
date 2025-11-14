import { NextRequest, NextResponse } from "next/server";
import { getLogs } from "@/lib/logs-store";

// 업로드된 로그 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const logType = searchParams.get("logType") || undefined;
    const keyword = searchParams.get("keyword") || undefined;
    const limit = parseInt(searchParams.get("limit") || "100", 10); // 기본 100개
    const offset = parseInt(searchParams.get("offset") || "0", 10); // 페이지네이션

    // 필터 적용하여 로그 조회
    const allLogs = getLogs({
      startDate,
      endDate,
      logType,
      keyword,
    });

    // 페이지네이션 적용
    const logs = allLogs.slice(offset, offset + limit);

    // 날짜 포맷팅
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      date: log.timestamp.toISOString().split("T")[0],
      time: log.timestamp.toTimeString().split(" ")[0],
      type: log.type,
      level: log.level,
      message: log.message,
      errorCode: log.errorCode,
      responseTime: log.responseTime,
      details: log.details,
      file: log.file,
    }));

    return NextResponse.json({
      logs: formattedLogs,
      total: allLogs.length,
      limit,
      offset,
      hasMore: offset + limit < allLogs.length,
    });
  } catch (error) {
    console.error("로그 목록 조회 오류:", error);
    return NextResponse.json(
      {
        error: "로그 목록 조회 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
