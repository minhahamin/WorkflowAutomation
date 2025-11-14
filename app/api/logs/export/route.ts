import { NextRequest, NextResponse } from "next/server";

// TODO: 실제 로그 데이터를 CSV로 변환
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // 임시 CSV 데이터
    const csvContent = `날짜,타입,메시지
2024-01-01,error,404 Not Found
2024-01-01,warning,Slow query detected
2024-01-02,info,User logged in`;

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=logs-${Date.now()}.csv`,
      },
    });
  } catch (error) {
    console.error("CSV 내보내기 오류:", error);
    return NextResponse.json(
      { error: "CSV 내보내기 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

