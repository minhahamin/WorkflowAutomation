import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

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

    // 파일 타입 확인
    const fileName = file.name.toLowerCase();
    let data: any;

    if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      // Excel 파일 파싱 (Node.js xlsx 라이브러리 사용)
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      data = XLSX.utils.sheet_to_json(firstSheet);
    } else if (fileName.endsWith(".json")) {
      // JSON 파일 파싱
      const text = await file.text();
      data = JSON.parse(text);
    } else {
      return NextResponse.json(
        { error: "지원하지 않는 파일 형식입니다. Excel 또는 JSON 파일만 업로드 가능합니다." },
        { status: 400 }
      );
    }

    // PDF 생성 (pdfmake 사용 - pdfkit 대신)
    // pdfmake를 동적으로 로드하여 webpack 번들링 제외
    let PdfPrinter: any;
    try {
      PdfPrinter = eval('require')("pdfmake");
    } catch (error) {
      console.error("pdfmake 모듈 로드 실패:", error);
      return NextResponse.json(
        { error: "PDF 생성 모듈을 로드할 수 없습니다." },
        { status: 500 }
      );
    }

    // 한글 폰트 설정
    const fontsPath = path.join(process.cwd(), "public", "fonts");
    const notoSansRegular = path.join(fontsPath, "NotoSansKR-Regular.ttf");
    const notoSansBold = path.join(fontsPath, "NotoSansKR-Bold.ttf");
    
    const hasKoreanFont = fs.existsSync(notoSansRegular) && fs.existsSync(notoSansBold);
    
    let fonts: any = {
      Roboto: {
        normal: "Helvetica",
        bold: "Helvetica-Bold",
        italics: "Helvetica-Oblique",
        bolditalics: "Helvetica-BoldOblique",
      },
    };

    if (hasKoreanFont) {
      try {
        fonts.NotoSansKR = {
          normal: fs.readFileSync(notoSansRegular),
          bold: fs.readFileSync(notoSansBold),
          italics: fs.readFileSync(notoSansRegular),
          bolditalics: fs.readFileSync(notoSansBold),
        };
      } catch (fontError) {
        console.warn("한글 폰트 로드 실패:", fontError);
      }
    }

    const printer = new PdfPrinter(fonts);

    // PDF 문서 내용 생성
    const content: any[] = [];

    // 제목
    content.push({
      text: `템플릿: ${template}`,
      style: "header",
      alignment: "center",
      margin: [0, 0, 0, 20],
    });

    // 값을 문자열로 변환하는 헬퍼 함수
    const formatValue = (value: any, indent: number = 0): any[] => {
      const indentStr = "  ".repeat(indent);
      
      if (value === null || value === undefined) {
        return [{ text: `${indentStr}null`, style: "body", margin: [0, 2, 0, 2] }];
      }
      
      if (Array.isArray(value)) {
        const result: any[] = [];
        value.forEach((item, index) => {
          result.push({
            text: `${indentStr}[${index + 1}]`,
            style: "subtitle",
            margin: [0, 5, 0, 2],
            fontSize: 11,
          });
          if (typeof item === "object" && item !== null) {
            Object.entries(item).forEach(([k, v]) => {
              result.push(...formatValue(v, indent + 1));
            });
          } else {
            result.push(...formatValue(item, indent + 1));
          }
        });
        return result;
      }
      
      if (typeof value === "object") {
        const result: any[] = [];
        Object.entries(value).forEach(([k, v]) => {
          result.push({
            text: `${indentStr}${k}:`,
            style: indent === 0 ? "subtitle" : "body",
            margin: [0, 3, 0, 1],
            fontSize: indent === 0 ? 11 : 10,
            bold: indent === 0,
          });
          result.push(...formatValue(v, indent + 1));
        });
        return result;
      }
      
      // 기본값 (문자열, 숫자, 불린 등)
      return [{
        text: `${indentStr}${String(value)}`,
        style: "body",
        margin: [indent * 10, 2, 0, 2],
        fontSize: 10,
      }];
    };

    // 데이터 추가
    if (Array.isArray(data)) {
      data.forEach((row, index) => {
        content.push({
          text: `항목 ${index + 1}`,
          style: "subtitle",
          margin: [0, 10, 0, 5],
          fontSize: 14,
          bold: true,
        });
        
        if (typeof row === "object" && row !== null) {
          Object.entries(row).forEach(([key, value]) => {
            content.push({
              text: key + ":",
              style: "subtitle",
              margin: [20, 5, 0, 1],
              fontSize: 11,
              bold: true,
            });
            content.push(...formatValue(value, 1));
          });
        } else {
          content.push(...formatValue(row, 1));
        }
      });
    } else {
      // 단일 객체인 경우
      Object.entries(data).forEach(([key, value]) => {
        content.push({
          text: key + ":",
          style: "subtitle",
          margin: [0, 5, 0, 1],
          fontSize: 11,
          bold: true,
        });
        content.push(...formatValue(value, 0));
      });
    }

    // PDF 문서 정의
    const docDefinition: any = {
      pageSize: "A4",
      pageMargins: [40, 60, 40, 60],
      defaultStyle: {
        font: hasKoreanFont && fonts.NotoSansKR ? "NotoSansKR" : "Roboto",
        fontSize: 10,
      },
      styles: {
        header: {
          fontSize: 20,
          bold: true,
        },
        subtitle: {
          fontSize: 14,
          bold: true,
        },
        body: {
          fontSize: 10,
        },
      },
      content: content,
    };

    // PDF 생성
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks: Buffer[] = [];
    
    pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));

    await new Promise<void>((resolve, reject) => {
      pdfDoc.on("end", resolve);
      pdfDoc.on("error", reject);
      pdfDoc.end();
    });

    const pdfBuffer = Buffer.concat(chunks);

    // 파일 저장 (실제로는 파일 시스템이나 S3에 저장)
    // 여기서는 Base64로 반환 (실제 구현 시 파일 저장 후 URL 반환)
    const pdfBase64 = pdfBuffer.toString("base64");
    const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`;

    return NextResponse.json({
      success: true,
      message: "PDF 생성 완료",
      pdfUrl: pdfDataUrl, // 실제로는 저장된 파일 URL 반환
    });
  } catch (error) {
    console.error("PDF 생성 오류:", error);
    return NextResponse.json(
      { error: "PDF 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
