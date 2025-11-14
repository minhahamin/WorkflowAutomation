"use client";

import { useQuery } from "@tanstack/react-query";

interface DocumentHistoryItem {
  id: string;
  template: string;
  fileName: string;
  createdAt: string;
  createdBy: string;
  status: "success" | "processing" | "failed";
}

export default function DocumentHistory() {
  const { data: history, isLoading } = useQuery<DocumentHistoryItem[]>({
    queryKey: ["document-history"],
    queryFn: async () => {
      // API 호출 (추후 구현)
      const response = await fetch("/api/documents/history");
      if (!response.ok) throw new Error("히스토리 조회 실패");
      return response.json();
    },
  });

  if (isLoading) {
    return <div className="text-gray-600">로딩 중...</div>;
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        생성된 문서가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto">
      {history.map((item) => (
        <div
          key={item.id}
          className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-semibold text-gray-900">{item.fileName}</p>
              <p className="text-sm text-gray-600">{item.template}</p>
            </div>
            <span
              className={`px-2 py-1 text-xs rounded ${
                item.status === "success"
                  ? "bg-green-100 text-green-800"
                  : item.status === "processing"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {item.status === "success" ? "완료" : item.status === "processing" ? "처리중" : "실패"}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            <p>생성자: {item.createdBy}</p>
            <p>생성일: {new Date(item.createdAt).toLocaleString("ko-KR")}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

