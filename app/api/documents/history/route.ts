import { NextRequest, NextResponse } from "next/server";
import { getDocumentHistory } from "@/lib/documents-store";

// 문서 생성 히스토리 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const templateId = searchParams.get("templateId") || undefined;

    // 템플릿 ID로 필터링하여 히스토리 조회
    const history = getDocumentHistory(templateId);

    return NextResponse.json(history);
  } catch (error) {
    console.error("히스토리 조회 오류:", error);
    return NextResponse.json(
      { error: "히스토리 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

