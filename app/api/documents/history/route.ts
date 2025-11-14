import { NextResponse } from "next/server";

// TODO: 데이터베이스에서 히스토리 조회
export async function GET() {
  try {
    // 임시 데이터
    const history = [
      {
        id: "1",
        template: "발주서",
        fileName: "order.xlsx",
        createdAt: new Date().toISOString(),
        createdBy: "홍길동",
        status: "success",
      },
    ];

    return NextResponse.json(history);
  } catch (error) {
    console.error("히스토리 조회 오류:", error);
    return NextResponse.json(
      { error: "히스토리 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

