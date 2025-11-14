import { NextRequest, NextResponse } from "next/server";
import { getStats } from "@/lib/logs-store";

// 실제 로그 데이터에서 통계 계산
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const logType = searchParams.get("logType") || undefined;
    const keyword = searchParams.get("keyword") || undefined;

    // 필터 적용하여 통계 계산
    const stats = getStats({
      startDate,
      endDate,
      logType,
      keyword,
    });

    // 데이터가 없을 때 기본값 제공
    if (stats.errorTypes.length === 0 && stats.timeSeries.length === 0) {
      return NextResponse.json({
        errorTypes: [],
        timeSeries: [],
        responseTime: {
          average: 0,
          max: 0,
          min: 0,
        },
        totalLogs: 0,
        message: "로그 데이터가 없습니다. 로그 파일을 업로드해주세요.",
      });
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("통계 조회 오류:", error);
    return NextResponse.json(
      {
        error: "통계 조회 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

