import { NextRequest, NextResponse } from "next/server";

// TODO: 알림 삭제 로직
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // TODO: 데이터베이스에서 알림 삭제
    // TODO: 스케줄 작업 취소

    return NextResponse.json({
      success: true,
      message: "알림이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("알림 삭제 오류:", error);
    return NextResponse.json(
      { error: "알림 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

