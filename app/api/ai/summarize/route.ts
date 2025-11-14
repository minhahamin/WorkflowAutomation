import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// OpenAI API를 사용한 문서 요약 (Node.js에서 직접 구현)
export async function POST(request: NextRequest) {
  let file: File | null = null;
  let summaryType: string = "summary";
  
  // 환경 변수 확인
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const testMode = process.env.OPENAI_TEST_MODE === "true";
  
  // 테스트 모드 함수 (재사용)
  const returnTestModeResponse = async (file: File, summaryType: string) => {
      let testFileContent = "";
      try {
        const fileName = file.name.toLowerCase();
        
        // PDF 파일 처리
        if (fileName.endsWith(".pdf")) {
          try {
            // pdf-parse를 동적으로 로드
            const pdfParse = eval('require')("pdf-parse");
            const arrayBuffer = await file.arrayBuffer();
            const pdfBuffer = Buffer.from(arrayBuffer);
            
            // PDF 파싱
            const pdfData = await pdfParse(pdfBuffer, {
              max: 0, // 모든 페이지 처리
            });
            
            // 텍스트 추출 및 한글 인코딩 처리
            let extractedText = pdfData.text || '';
            
            // 한글 인코딩 복구 시도
            if (extractedText) {
              const hasKoreanInOriginal = /[\u3131-\u3163\uac00-\ud7a3]/.test(pdfData.text);
              
              if (!hasKoreanInOriginal) {
                try {
                  const reencoded = Buffer.from(pdfData.text, 'latin1').toString('utf8');
                  const hasKoreanAfterReencode = /[\u3131-\u3163\uac00-\ud7a3]/.test(reencoded);
                  
                  if (hasKoreanAfterReencode) {
                    extractedText = reencoded;
                  }
                } catch (encodeError) {
                  // 인코딩 변환 실패 시 원본 사용
                }
              }
            }
            
            testFileContent = extractedText || "PDF에서 텍스트를 추출할 수 없습니다.";
          } catch (pdfError) {
            console.error("테스트 모드 PDF 파싱 오류:", pdfError);
            testFileContent = "PDF 파일을 처리할 수 없습니다. (테스트 모드)";
          }
        } else if (fileName.endsWith(".txt") || fileName.endsWith(".json") || fileName.endsWith(".md")) {
          // 텍스트 파일 처리
          testFileContent = await file.text();
        } else {
          // 기타 파일 형식
          testFileContent = await file.text();
        }
      } catch (e) {
        testFileContent = "테스트 파일 내용을 읽을 수 없습니다.";
      }
      
      const testSummary = `[테스트 모드] 문서 요약 결과

요약 유형: ${summaryType || "summary"}

문서 내용:
${testFileContent.substring(0, 200)}${testFileContent.length > 200 ? "..." : ""}

요약:
이 문서는 테스트 모드에서 생성된 임시 요약입니다. 
실제 OpenAI API를 사용하려면 OPENAI_API_KEY를 설정하고 OPENAI_TEST_MODE를 false로 변경하세요.

주요 내용:
- 문서 길이: ${testFileContent.length}자
- 요약 타입: ${summaryType || "기본"}
- 생성 시간: ${new Date().toLocaleString("ko-KR")}
`;

      return NextResponse.json({
        success: true,
        summary: testSummary,
        testMode: true,
        message: "테스트 모드: 실제 OpenAI API를 사용하려면 결제 정보를 추가하세요."
      });
    };
  
  try {
    // FormData 파싱
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (parseError) {
      console.error("FormData 파싱 오류:", parseError);
      return NextResponse.json(
        { 
          error: "요청 형식이 올바르지 않습니다.",
          details: parseError instanceof Error ? parseError.message : "FormData를 파싱할 수 없습니다."
        },
        { status: 400 }
      );
    }

    file = formData.get("file") as File;
    summaryType = formData.get("summaryType") as string || "summary";

    if (!file) {
      return NextResponse.json(
        { error: "파일이 필요합니다." },
        { status: 400 }
      );
    }
    
    // 테스트 모드: API Key 없이도 동작 (임시 응답 반환)
    if (testMode && !openaiApiKey) {
      return await returnTestModeResponse(file, summaryType);
    }
    
    if (!openaiApiKey) {
      return NextResponse.json(
        { 
          error: "OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.",
          hint: ".env.local 파일에 OPENAI_API_KEY를 추가하거나, OPENAI_TEST_MODE=true로 설정하여 테스트 모드를 사용하세요."
        },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });

    // 파일 읽기 (텍스트 파일인 경우)
    let fileContent: string;
    const fileName = file.name.toLowerCase();

    try {
      if (fileName.endsWith(".txt") || fileName.endsWith(".json") || fileName.endsWith(".md")) {
        fileContent = await file.text();
      } else if (fileName.endsWith(".pdf")) {
        // PDF는 텍스트 추출이 필요
        // pdf-parse를 동적으로 require하여 webpack 번들링 제외
        try {
          // require를 함수 내부에서 실행하여 webpack 번들링에서 제외
          const pdfParse = eval('require')("pdf-parse");
          const arrayBuffer = await file.arrayBuffer();
          const pdfBuffer = Buffer.from(arrayBuffer);
          
          // PDF 파싱 (모든 페이지 처리)
          const pdfData = await pdfParse(pdfBuffer, {
            max: 0, // 모든 페이지 처리
          });
          
          // 텍스트 추출 및 한글 인코딩 처리
          let extractedText = pdfData.text || '';
          
          // 한글 인코딩 문제 해결
          // pdf-parse가 반환한 텍스트가 깨진 경우 복구 시도
          if (extractedText) {
            // 먼저 원본 텍스트에 한글이 있는지 확인
            const hasKoreanInOriginal = /[\u3131-\u3163\uac00-\ud7a3]/.test(pdfData.text);
            
            if (!hasKoreanInOriginal) {
              // 원본에 한글이 없으면, 인코딩 문제일 수 있음
              // latin1 인코딩으로 재해석 시도 (모든 바이트 보존)
              try {
                const reencoded = Buffer.from(pdfData.text, 'latin1').toString('utf8');
                const hasKoreanAfterReencode = /[\u3131-\u3163\uac00-\ud7a3]/.test(reencoded);
                
                if (hasKoreanAfterReencode) {
                  // 재인코딩 후 한글이 있으면 사용
                  extractedText = reencoded;
                  console.log("✅ 한글 인코딩 복구 성공");
                }
              } catch (encodeError) {
                // 인코딩 변환 실패 시 원본 사용
                console.warn("⚠️ 인코딩 변환 실패, 원본 텍스트 사용");
              }
            }
            
            // 디버깅: 추출된 텍스트 일부 로그 (한글 확인)
            if (extractedText.length > 0) {
              const preview = extractedText.substring(0, 100);
              const hasKorean = /[\u3131-\u3163\uac00-\ud7a3]/.test(preview);
              console.log(`📄 PDF 텍스트 추출: ${extractedText.length}자, 한글 포함: ${hasKorean ? '✅' : '❌'}`);
              if (preview) {
                console.log(`📝 미리보기: ${preview}...`);
              }
            }
          }
          
          fileContent = extractedText;
          
          if (!fileContent || fileContent.trim().length === 0) {
            return NextResponse.json(
              { error: "PDF에서 텍스트를 추출할 수 없습니다. 텍스트가 포함된 PDF 파일을 사용해주세요." },
              { status: 400 }
            );
          }
        } catch (pdfError) {
          console.error("PDF 파싱 오류:", pdfError);
          const errorMessage = pdfError instanceof Error ? pdfError.message : String(pdfError);
          
          // 특정 오류에 대한 안내 메시지
          if (errorMessage.includes("Cannot read properties") || errorMessage.includes("undefined")) {
            return NextResponse.json(
              { 
                error: "PDF 파일을 처리할 수 없습니다.",
                hint: "PDF 파일이 손상되었거나 지원하지 않는 형식일 수 있습니다. 다른 PDF 파일을 시도해보세요.",
                details: "PDF 파싱 중 내부 오류가 발생했습니다."
              },
              { status: 400 }
            );
          }
          
          return NextResponse.json(
            { 
              error: "PDF 파일 처리를 위해 pdf-parse 라이브러리가 필요합니다.",
              hint: "PDF 지원을 활성화하려면: npm install pdf-parse",
              details: errorMessage
            },
            { status: 400 }
          );
        }
      } else {
        // 기타 파일 형식은 텍스트로 읽기 시도
        fileContent = await file.text();
      }

      if (!fileContent || fileContent.trim().length === 0) {
        return NextResponse.json(
          { error: "파일 내용이 비어있습니다." },
          { status: 400 }
        );
      }
    } catch (fileError) {
      console.error("파일 읽기 오류:", fileError);
      return NextResponse.json(
        { error: `파일 읽기 실패: ${fileError instanceof Error ? fileError.message : "알 수 없는 오류"}` },
        { status: 400 }
      );
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
  } catch (error: any) {
    console.error("AI 요약 오류:", error);
    
    // OpenAI API 오류 처리
    if (error instanceof OpenAI.APIError || error?.status) {
      // 할당량 초과(429) 또는 인증 오류(401)인 경우 테스트 모드로 폴백
      const errorCode = error?.status || error?.code;
      const isQuotaError = errorCode === 429 || 
                          error?.message?.includes("quota") || 
                          error?.message?.includes("insufficient") ||
                          error?.message?.includes("exceeded");
      
      // 할당량 오류 발생 시 자동으로 테스트 모드로 전환 (기본 동작)
      const autoTestMode = process.env.OPENAI_AUTO_TEST_MODE !== "false"; // 기본값: true
      
      if (isQuotaError && (testMode || autoTestMode)) {
        console.log("⚠️ 할당량 초과로 테스트 모드로 자동 전환");
        if (file) {
          return await returnTestModeResponse(file, summaryType);
        }
      }
      
      return NextResponse.json(
        { 
          error: `OpenAI API 오류: ${error.message || error.error?.message || "알 수 없는 오류"}`,
          details: error.error || undefined,
          hint: isQuotaError ? "할당량이 부족합니다. .env.local에 OPENAI_AUTO_TEST_MODE=true를 추가하여 테스트 모드로 자동 전환하세요." : undefined
        },
        { status: error.status || 500 }
      );
    }

    // 일반 오류 처리
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: "AI 요약 생성 중 오류가 발생했습니다.",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
