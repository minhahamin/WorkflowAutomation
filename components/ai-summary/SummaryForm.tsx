"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const summarySchema = z.object({
  file: z.instanceof(FileList).refine((files) => files.length > 0, {
    message: "파일을 선택해주세요.",
  }),
  summaryType: z.enum(["summary", "keypoints", "full"]),
});

type SummaryFormData = z.infer<typeof summarySchema>;

interface SummaryFormProps {
  onSummaryGenerated: (summary: string) => void;
  onProcessingChange: (processing: boolean) => void;
}

export default function AISummaryForm({
  onSummaryGenerated,
  onProcessingChange,
}: SummaryFormProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SummaryFormData>({
    resolver: zodResolver(summarySchema),
  });

  const onSubmit = async (data: SummaryFormData) => {
    onProcessingChange(true);
    setError(null);

    try {
      const file = data.file[0];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("summaryType", data.summaryType);

      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("요약 생성 실패");
      }

      const result = await response.json();
      onSummaryGenerated(result.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "요약 생성 중 오류가 발생했습니다.");
    } finally {
      onProcessingChange(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          문서 업로드 (PDF, 텍스트)
        </label>
        <input
          type="file"
          accept=".pdf,.txt,.docx"
          {...register("file")}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-purple-50 file:text-purple-700
            hover:file:bg-purple-100"
        />
        {errors.file && (
          <p className="mt-1 text-sm text-red-600">{errors.file.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          요약 유형
        </label>
        <select
          {...register("summaryType")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="summary">간단 요약</option>
          <option value="keypoints">핵심 포인트 추출</option>
          <option value="full">상세 분석</option>
        </select>
      </div>

      {error && (
        <div className="p-3 bg-red-50 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold
          hover:bg-purple-700 transition-colors"
      >
        🤖 AI 요약 생성
      </button>

      <div className="p-4 bg-purple-50 rounded-lg">
        <h3 className="font-semibold text-purple-900 mb-2">💡 기능 안내</h3>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• 간단 요약: 문서의 주요 내용을 요약</li>
          <li>• 핵심 포인트: 중요한 키워드와 포인트 추출</li>
          <li>• 상세 분석: 문맥을 고려한 깊이 있는 분석</li>
        </ul>
      </div>
    </form>
  );
}

