"use client";

import { useState } from "react";
import Link from "next/link";
import DocumentUploadForm from "@/components/documents/UploadForm";
import DocumentHistory from "@/components/documents/History";
import PDFPreview from "@/components/documents/PDFPreview";

export default function DocumentsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [generatedPDF, setGeneratedPDF] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← 홈으로
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📄 문서 자동화
          </h1>
          <p className="text-gray-600">
            Excel 또는 JSON 파일을 업로드하여 템플릿 기반 PDF를 자동으로 생성합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 폼 영역 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 템플릿 선택 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                PDF 템플릿 선택
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { id: "order", name: "발주서", icon: "📋" },
                  { id: "report", name: "보고서", icon: "📊" },
                  { id: "checklist", name: "체크리스트", icon: "✅" },
                  { id: "invoice", name: "인보이스", icon: "🧾" },
                  { id: "contract", name: "계약서", icon: "📝" },
                  { id: "custom", name: "커스텀", icon: "⚙️" },
                ].map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedTemplate === template.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-3xl mb-2">{template.icon}</div>
                    <div className="font-medium text-gray-900">{template.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 파일 업로드 폼 */}
            <DocumentUploadForm
              selectedTemplate={selectedTemplate}
              onUpload={setUploadedFile}
              onGenerate={setGeneratedPDF}
            />

            {/* PDF 미리보기 */}
            {generatedPDF && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  PDF 미리보기
                </h2>
                <PDFPreview pdfUrl={generatedPDF} />
              </div>
            )}
          </div>

          {/* 오른쪽: 히스토리 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">
                  생성 히스토리
                </h2>
                {selectedTemplate && (
                  <span className="text-sm text-gray-500 bg-blue-50 px-2 py-1 rounded">
                    필터: {[
                      { id: "order", name: "발주서" },
                      { id: "report", name: "보고서" },
                      { id: "checklist", name: "체크리스트" },
                      { id: "invoice", name: "인보이스" },
                      { id: "contract", name: "계약서" },
                      { id: "custom", name: "커스텀" },
                    ].find(t => t.id === selectedTemplate)?.name || selectedTemplate}
                  </span>
                )}
              </div>
              <DocumentHistory selectedTemplate={selectedTemplate} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

