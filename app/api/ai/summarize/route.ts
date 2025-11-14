import { NextRequest, NextResponse } from "next/server";

// TODO: OpenAI API 연동 및 Python Worker 활용
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

    // TODO: 실제 AI 요약 로직
    // 방법 1: Node.js에서 OpenAI API 직접 호출
    /*
    import OpenAI from 'openai';
    const openai = new OpenAI({ apiKey: openaiApiKey });
    
    // 파일 읽기
    const fileContent = await file.text();
    
    // OpenAI API 호출
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "당신은 문서 요약 전문가입니다. 주어진 문서를 요약해주세요."
        },
        {
          role: "user",
          content: fileContent
        }
      ]
    });
    
    const summary = response.choices[0].message.content;
    */

    // 방법 2: Python Worker로 전송하여 처리
    /*
    const pythonWorkerUrl = process.env.PYTHON_WORKER_URL || 'http://localhost:8000';
    const response = await fetch(`${pythonWorkerUrl}/ai/summarize`, {
      method: 'POST',
      body: formData
    });
    const result = await response.json();
    */

    // 임시 응답 (실제 구현 시 위 코드 사용)
    const summary = `
# 문서 요약

이 문서는 업무 자동화 시스템에 대한 내용을 다루고 있습니다.

## 핵심 포인트
1. 문서 자동화를 통한 업무 효율성 향상
2. 로그 분석을 통한 시스템 모니터링
3. 알림 시스템을 통한 작업 관리
4. AI 기반 문서 요약 및 분석

## 요약
본 시스템은 다양한 업무 프로세스를 자동화하여 생산성을 높이는 것을 목표로 합니다.
`;

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("AI 요약 오류:", error);
    return NextResponse.json(
      { error: "AI 요약 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
