import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import PDFDocument from "pdfkit";

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

    // PDF 생성 (간단한 버전)
    // 복잡한 템플릿은 Python Worker로 처리하는 것을 권장
    const pdfDoc = new PDFDocument();
    const pdfChunks: Buffer[] = [];

    pdfDoc.on("data", (chunk: Buffer) => pdfChunks.push(chunk));
    pdfDoc.on("end", () => {});

    // 템플릿에 따라 PDF 생성
    pdfDoc.fontSize(20).text(`템플릿: ${template}`, { align: "center" });
    pdfDoc.moveDown();

    if (Array.isArray(data)) {
      data.forEach((row, index) => {
        pdfDoc.fontSize(12).text(`항목 ${index + 1}:`, { continued: false });
        Object.entries(row).forEach(([key, value]) => {
          pdfDoc.text(`  ${key}: ${value}`, { indent: 20 });
        });
        pdfDoc.moveDown();
      });
    } else {
      Object.entries(data).forEach(([key, value]) => {
        pdfDoc.text(`${key}: ${value}`);
      });
    }

    pdfDoc.end();

    // PDF 버퍼 생성 대기
    await new Promise((resolve) => {
      pdfDoc.on("end", resolve);
    });

    const pdfBuffer = Buffer.concat(pdfChunks);

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
