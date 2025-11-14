import { NextRequest, NextResponse } from "next/server";
import { getLogs } from "@/lib/logs-store";

// 실제 로그 데이터를 CSV로 변환
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const logType = searchParams.get("logType") || undefined;
    const keyword = searchParams.get("keyword") || undefined;

    // 필터 적용하여 로그 조회
    const logs = getLogs({
      startDate,
      endDate,
      logType,
      keyword,
    });

    if (logs.length === 0) {
      return NextResponse.json(
        { error: "내보낼 로그 데이터가 없습니다." },
        { status: 404 }
      );
    }

    // CSV 헤더
    const csvRows = [
      "날짜,시간,타입,레벨,메시지,에러코드,응답시간(ms)",
    ];

    // CSV 데이터
    logs.forEach((log) => {
      const date = log.timestamp.toISOString().split("T")[0];
      const time = log.timestamp.toTimeString().split(" ")[0];
      const message = log.message.replace(/"/g, '""'); // CSV 이스케이프
      const row = [
        date,
        time,
        log.type,
        log.level,
        `"${message}"`, // 메시지는 따옴표로 감싸기
        log.errorCode || "",
        log.responseTime?.toString() || "",
      ].join(",");
      csvRows.push(row);
    });

    const csvContent = csvRows.join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=logs-${Date.now()}.csv`,
      },
    });
  } catch (error) {
    console.error("CSV 내보내기 오류:", error);
    return NextResponse.json(
      {
        error: "CSV 내보내기 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

