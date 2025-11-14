"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

export default function LogUploadForm() {
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { register, handleSubmit } = useForm();

  const onSubmit = async (data: any) => {
    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", data.file[0]);

      const response = await fetch("/api/logs/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("업로드 실패");
      }

      setMessage("로그 파일이 성공적으로 업로드되었습니다.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          로그 파일 업로드
        </label>
        <input
          type="file"
          accept=".log,.txt,.csv"
          {...register("file")}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      {message && (
        <div className={`p-3 rounded-lg ${message.includes("성공") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
          <p className="text-sm">{message}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isUploading}
        className="bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold
          hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
          transition-colors"
      >
        {isUploading ? "업로드 중..." : "업로드"}
      </button>
    </form>
  );
}

