import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// pdfmake를 동적으로 import (서버 사이드에서만)
// Next.js의 webpack 번들링 문제를 피하기 위해 동적 require 사용

// AI 요약 결과를 PDF로 저장 (pdfmake 사용 - 한글 지원)
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

    // pdfmake 폰트 설정
    // 한글 폰트를 추가하려면 public/fonts/ 폴더에 폰트 파일(.ttf)을 추가하세요
    // NotoSansKR: https://fonts.google.com/noto/specimen/Noto+Sans+KR
    // NanumGothic: https://hangeul.naver.com/font/nanum
    
    const fontsPath = path.join(process.cwd(), "public", "fonts");
    const notoSansRegular = path.join(fontsPath, "NotoSansKR-Regular.ttf");
    const notoSansBold = path.join(fontsPath, "NotoSansKR-Bold.ttf");
    
    // 한글 폰트 파일이 존재하는지 확인
    const hasKoreanFont = fs.existsSync(notoSansRegular) && fs.existsSync(notoSansBold);
    
    if (!hasKoreanFont) {
      console.warn("⚠️ 한글 폰트 파일이 없습니다. 한글이 깨져서 표시될 수 있습니다.");
      console.warn("📁 폰트 추가 방법: public/fonts/ 폴더에 NotoSansKR-Regular.ttf, NotoSansKR-Bold.ttf 추가");
    }
    
    // 한글 폰트 파일이 존재하는 경우 사용
    let fonts: any = {
      Roboto: {
        normal: "Helvetica",
        bold: "Helvetica-Bold",
        italics: "Helvetica-Oblique",
        bolditalics: "Helvetica-BoldOblique",
      },
    };

    // 한글 폰트 파일이 있으면 추가
    if (hasKoreanFont) {
      try {
        fonts.NotoSansKR = {
          normal: fs.readFileSync(notoSansRegular),
          bold: fs.readFileSync(notoSansBold),
          italics: fs.readFileSync(notoSansRegular),
          bolditalics: fs.readFileSync(notoSansBold),
        };
        console.log("✅ 한글 폰트 로드 성공");
      } catch (fontError) {
        console.error("한글 폰트 로드 실패:", fontError);
      }
    }

    // pdfmake를 동적으로 로드 (서버 사이드에서만)
    let PdfPrinter: any;
    try {
      // require를 함수 내부에서 실행하여 webpack 번들링에서 제외
      PdfPrinter = eval('require')("pdfmake");
    } catch (error) {
      console.error("pdfmake 모듈 로드 실패:", error);
      return NextResponse.json(
        { 
          error: "PDF 생성 모듈을 로드할 수 없습니다.",
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }

    const printer = new PdfPrinter(fonts);

    // PDF 문서 정의
    const lines = summary.split("\n");
    const content: any[] = [];

    // 제목
    content.push({
      text: "AI 문서 요약",
      style: "header",
      alignment: "center",
      margin: [0, 0, 0, 10],
    });

    // 생성 시간
    content.push({
      text: `생성 시간: ${new Date().toLocaleString("ko-KR")}`,
      style: "subheader",
      alignment: "right",
      margin: [0, 0, 0, 10],
    });

    // 구분선
    content.push({
      canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5 }],
      margin: [0, 0, 0, 10],
    });

    // 요약 내용 파싱
    lines.forEach((line: string) => {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        content.push({ text: "", margin: [0, 0, 0, 5] });
        return;
      }

      if (trimmedLine.startsWith("# ")) {
        content.push({
          text: trimmedLine.substring(2),
          style: "title",
          margin: [0, 5, 0, 5],
        });
      } else if (trimmedLine.startsWith("## ")) {
        content.push({
          text: trimmedLine.substring(3),
          style: "subtitle",
          margin: [0, 5, 0, 3],
        });
      } else if (trimmedLine.startsWith("### ")) {
        content.push({
          text: trimmedLine.substring(4),
          style: "heading3",
          margin: [0, 3, 0, 2],
        });
      } else if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("• ")) {
        content.push({
          text: trimmedLine.substring(2),
          style: "listItem",
          margin: [10, 2, 0, 2],
        });
      } else {
        content.push({
          text: trimmedLine,
          style: "body",
          margin: [0, 2, 0, 2],
        });
      }
    });

    const docDefinition: any = {
      pageSize: "A4",
      pageMargins: [40, 60, 40, 60],
      defaultStyle: {
        font: hasKoreanFont && fonts.NotoSansKR ? "NotoSansKR" : "Roboto", // 한글 폰트가 있으면 사용
        fontSize: 10,
      },
      styles: {
        header: {
          fontSize: 24,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        subheader: {
          fontSize: 8,
          margin: [0, 0, 0, 10],
        },
        title: {
          fontSize: 18,
          bold: true,
        },
        subtitle: {
          fontSize: 16,
          bold: true,
        },
        heading3: {
          fontSize: 14,
          bold: true,
        },
        listItem: {
          fontSize: 10,
          margin: [10, 2, 0, 2],
        },
        body: {
          fontSize: 10,
        },
      },
      content: content,
    };

    // PDF 생성
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    // PDF를 Buffer로 변환
    const chunks: Buffer[] = [];
    pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));

    await new Promise<void>((resolve, reject) => {
      pdfDoc.on("end", resolve);
      pdfDoc.on("error", reject);
      pdfDoc.end();
    });

    const pdfBuffer = Buffer.concat(chunks);

    // PDF 파일로 반환
    const fileName = `ai-summary-${Date.now()}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("PDF 저장 오류:", error);
    return NextResponse.json(
      { 
        error: "PDF 저장 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

