import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// OpenAI API를 사용한 문서 요약 (Node.js에서 직접 구현)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const summaryType = formData.get("summaryType") as string;

    if (!file) {
      return NextResponse.json(
        { error: "파일이 필요합니다." },
        { status: 400 }
      );
    }

    // OpenAI API Key 확인
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY 환경 변수가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });

    // 파일 읽기 (텍스트 파일인 경우)
    let fileContent: string;
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith(".txt")) {
      fileContent = await file.text();
    } else if (fileName.endsWith(".pdf")) {
      // PDF는 텍스트 추출이 필요 (Node.js에서는 제한적)
      // pdf-parse 라이브러리를 사용하거나 Python Worker로 처리 권장
      return NextResponse.json(
        { error: "PDF 파일은 현재 지원하지 않습니다. 텍스트 파일을 사용해주세요. (PDF 지원은 Python Worker 추가 예정)" },
        { status: 400 }
      );
    } else {
      fileContent = await file.text();
    }

    // 요약 유형에 따른 프롬프트 설정
    let systemPrompt = "";
    switch (summaryType) {
      case "summary":
        systemPrompt = "당신은 문서 요약 전문가입니다. 주어진 문서를 간결하게 요약해주세요.";
        break;
      case "keypoints":
        systemPrompt = "당신은 문서 분석 전문가입니다. 주어진 문서의 핵심 포인트를 추출해주세요.";
        break;
      case "full":
        systemPrompt = "당신은 문서 분석 전문가입니다. 주어진 문서를 상세히 분석하고 요약해주세요.";
        break;
      default:
        systemPrompt = "당신은 문서 요약 전문가입니다. 주어진 문서를 요약해주세요.";
    }

    // OpenAI API 호출
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 또는 "gpt-4", 비용 고려하여 선택
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `다음 문서를 요약해주세요:\n\n${fileContent.substring(0, 16000)}`, // 토큰 제한 고려
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const summary = response.choices[0].message.content;

    if (!summary) {
      return NextResponse.json(
        { error: "요약 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("AI 요약 오류:", error);
    
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `OpenAI API 오류: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "AI 요약 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
