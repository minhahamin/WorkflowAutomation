"use client";

import { useState } from "react";

interface PDFPreviewProps {
  pdfUrl: string;
}

export default function PDFPreview({ pdfUrl }: PDFPreviewProps) {
  const [loading, setLoading] = useState(true);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = "generated-document.pdf";
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">미리보기</h3>
        <button
          onClick={handleDownload}
          className="bg-green-600 text-white py-2 px-4 rounded-lg font-semibold
            hover:bg-green-700 transition-colors"
        >
          ⬇️ 다운로드
        </button>
      </div>

      <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center h-96 bg-gray-100">
            <div className="text-gray-600">PDF 로딩 중...</div>
          </div>
        )}
        <iframe
          src={pdfUrl}
          className="w-full h-[600px]"
          onLoad={() => setLoading(false)}
          title="PDF Preview"
        />
      </div>
    </div>
  );
}

