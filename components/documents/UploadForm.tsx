"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// FileList는 브라우저에서만 사용 가능하므로 동적 검증 사용
const uploadSchema = z.object({
  file: z.any().refine(
    (files) => {
      // 브라우저 환경에서만 FileList 체크
      if (typeof window === "undefined") return true; // 서버에서는 항상 통과
      return files instanceof FileList && files.length > 0;
    },
    {
      message: "파일을 선택해주세요.",
    }
  ),
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface UploadFormProps {
  selectedTemplate: string;
  onUpload: (file: File) => void;
  onGenerate: (pdfUrl: string) => void;
}

export default function DocumentUploadForm({
  selectedTemplate,
  onUpload,
  onGenerate,
}: UploadFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
  });

  const onSubmit = async (data: UploadFormData) => {
    if (!selectedTemplate) {
      setError("템플릿을 먼저 선택해주세요.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const file = data.file[0];
      onUpload(file);

      // FormData 생성
      const formData = new FormData();
      formData.append("file", file);
      formData.append("template", selectedTemplate);

      // API 호출 (추후 구현)
      const response = await fetch("/api/documents/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("PDF 생성에 실패했습니다.");
      }

      const result = await response.json();
      onGenerate(result.pdfUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        문서 생성하기
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            파일 업로드 (Excel 또는 JSON)
          </label>
          <input
            type="file"
            accept=".xlsx,.xls,.json"
            {...register("file")}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          {errors.file && (
            <p className="mt-1 text-sm text-red-600">{errors.file.message}</p>
          )}
        </div>

        {selectedTemplate && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              선택된 템플릿: <strong>{selectedTemplate}</strong>
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isProcessing || !selectedTemplate}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold
            hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
            transition-colors"
        >
          {isProcessing ? "처리 중..." : "PDF 생성하기"}
        </button>
      </form>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">📌 사용 방법</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>1. 템플릿을 선택합니다</li>
          <li>2. Excel 또는 JSON 파일을 업로드합니다</li>
          <li>3. "PDF 생성하기" 버튼을 클릭합니다</li>
          <li>4. 생성된 PDF를 미리보고 다운로드합니다</li>
        </ul>
      </div>
    </div>
  );
}

