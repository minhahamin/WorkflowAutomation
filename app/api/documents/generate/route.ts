import { NextRequest, NextResponse } from "next/server";

// TODO: Python Worker와 연동하여 실제 PDF 생성
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const template = formData.get("template") as string;

    if (!file || !template) {
      return NextResponse.json(
        { error: "파일과 템플릿이 필요합니다." },
        { status: 400 }
      );
    }

    // TODO: 실제 PDF 생성 로직
    // 1. Python Worker로 파일 전송
    // 2. Worker에서 PDF 생성
    // 3. 생성된 PDF URL 반환

    // 임시 응답
    return NextResponse.json({
      success: true,
      message: "PDF 생성 요청이 큐에 추가되었습니다.",
      pdfUrl: "/sample.pdf", // 실제 PDF URL로 교체 필요
    });
  } catch (error) {
    console.error("PDF 생성 오류:", error);
    return NextResponse.json(
      { error: "PDF 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

