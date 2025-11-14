import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";

// AI 요약 결과를 PDF로 저장
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

    // jsPDF로 PDF 생성 (pdfkit 대신 사용 - Next.js에서 더 안정적)
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // 페이지 설정
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // 제목
    doc.setFontSize(20);
    doc.text("AI 문서 요약", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;

    // 생성 시간
    doc.setFontSize(8);
    const timeText = `생성 시간: ${new Date().toLocaleString("ko-KR")}`;
    doc.text(timeText, pageWidth - margin, yPosition, { align: "right" });
    yPosition += 10;

    // 구분선
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // 요약 내용을 라인 단위로 분할하여 추가
    doc.setFontSize(12);
    const lines = summary.split("\n");
    const lineHeight = 7;
    const maxWidth = pageWidth - margin * 2;

    lines.forEach((line: string) => {
      // 페이지 넘김 처리
      if (yPosition > pageHeight - margin - 15) {
        doc.addPage();
        yPosition = margin;
      }

      // 제목 감지 (마크다운 스타일)
      if (line.startsWith("# ")) {
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        const text = line.substring(2).trim();
        const textLines: string[] = doc.splitTextToSize(text, maxWidth);
        doc.text(textLines, margin, yPosition);
        yPosition += textLines.length * lineHeight + 3;
      } else if (line.startsWith("## ")) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        const text = line.substring(3).trim();
        const textLines: string[] = doc.splitTextToSize(text, maxWidth);
        doc.text(textLines, margin, yPosition);
        yPosition += textLines.length * lineHeight + 2;
      } else if (line.startsWith("### ")) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        const text = line.substring(4).trim();
        const textLines: string[] = doc.splitTextToSize(text, maxWidth);
        doc.text(textLines, margin, yPosition);
        yPosition += textLines.length * lineHeight + 2;
      } else if (line.startsWith("- ") || line.startsWith("• ")) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const text = line.trim();
        const textLines: string[] = doc.splitTextToSize(text, maxWidth - 5);
        doc.text(textLines, margin + 5, yPosition);
        yPosition += textLines.length * lineHeight + 2;
      } else if (line.trim() === "") {
        yPosition += 3;
      } else {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const textLines: string[] = doc.splitTextToSize(line.trim(), maxWidth);
        doc.text(textLines, margin, yPosition);
        yPosition += textLines.length * lineHeight + 2;
      }
    });

    // PDF를 Buffer로 변환
    const pdfOutput = doc.output("arraybuffer");
    if (!pdfOutput) {
      throw new Error("PDF 생성 실패");
    }
    const pdfBuffer = Buffer.from(pdfOutput);

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

