import { NextRequest, NextResponse } from "next/server";

// TODO: 실제 로그 데이터에서 통계 계산
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const logType = searchParams.get("logType");
    const keyword = searchParams.get("keyword");

    // 임시 통계 데이터
    const stats = {
      errorTypes: [
        { type: "404", count: 45 },
        { type: "500", count: 23 },
        { type: "Timeout", count: 12 },
        { type: "DB Error", count: 8 },
      ],
      timeSeries: [
        { date: "2024-01-01", errors: 10, warnings: 15, info: 50 },
        { date: "2024-01-02", errors: 8, warnings: 12, info: 45 },
        { date: "2024-01-03", errors: 15, warnings: 20, info: 60 },
        { date: "2024-01-04", errors: 12, warnings: 18, info: 55 },
      ],
      responseTime: {
        average: 245,
        max: 1200,
        min: 50,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("통계 조회 오류:", error);
    return NextResponse.json(
      { error: "통계 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

