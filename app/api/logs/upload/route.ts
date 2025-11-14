import { NextRequest, NextResponse } from "next/server";

// TODO: 파일 저장 및 로그 파싱
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

    // TODO: 실제 로그 파싱 및 저장 로직
    // 1. 파일 저장
    // 2. 로그 파싱
    // 3. 데이터베이스 저장

    return NextResponse.json({
      success: true,
      message: "로그 파일이 업로드되었습니다.",
    });
  } catch (error) {
    console.error("로그 업로드 오류:", error);
    return NextResponse.json(
      { error: "로그 업로드 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

