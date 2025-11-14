import { NextRequest, NextResponse } from "next/server";

// TODO: Python Worker로 PDF 생성 요청
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { summary } = body;

    if (!summary) {
      return NextResponse.json(
        { error: "요약 내용이 필요합니다." },
        { status: 400 }
      );
    }

    // TODO: 실제 PDF 생성 로직
    // Python Worker로 PDF 생성 요청

    // 임시: 텍스트를 PDF로 변환한 것처럼 처리
    // 실제로는 Python Worker에서 PDF 생성 후 파일 반환

    return NextResponse.json({
      error: "PDF 생성 기능은 아직 구현되지 않았습니다.",
    }, { status: 501 });
  } catch (error) {
    console.error("PDF 저장 오류:", error);
    return NextResponse.json(
      { error: "PDF 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

