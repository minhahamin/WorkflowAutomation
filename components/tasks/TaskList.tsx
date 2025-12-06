"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface Task {
  id: string;
  name: string;
  description?: string;
  type: "email" | "webhook" | "report" | "custom";
  cron: string;
  enabled: boolean;
  status: "active" | "paused" | "failed";
  lastRunAt?: string;
  lastRunStatus?: "success" | "failed";
  lastRunError?: string;
  runCount: number;
  successCount: number;
  failureCount: number;
}

export default function TaskList() {
  const queryClient = useQueryClient();
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);

  const { data: response, isLoading } = useQuery<{ tasks: Task[] }>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("작업 조회 실패");
      return res.json();
    },
    refetchInterval: 30000, // 30초마다 자동 새로고침
  });

  const tasks = response?.tasks || [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("삭제 실패");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!response.ok) throw new Error("상태 변경 실패");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const executeMutation = useMutation({
    mutationFn: async (id: string) => {
      setExecutingTaskId(id);
      const response = await fetch(`/api/tasks/${id}/execute`, {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "실행 실패");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setExecutingTaskId(null);
      alert("✅ 작업이 실행되었습니다!");
    },
    onError: (error: Error) => {
      setExecutingTaskId(null);
      alert(`❌ 실행 실패: ${error.message}`);
    },
  });

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      email: "📧 이메일",
      webhook: "🔗 웹훅",
      report: "📊 리포트",
      custom: "⚙️ 커스텀",
    };
    return labels[type] || type;
  };

  const getStatusLabel = (task: Task) => {
    if (!task.enabled) return { label: "⏸️ 일시정지", color: "bg-gray-100 text-gray-800" };
    if (task.status === "failed") return { label: "❌ 실패", color: "bg-red-100 text-red-800" };
    return { label: "✅ 활성", color: "bg-green-100 text-green-800" };
  };

  if (isLoading) {
    return <div className="text-gray-600">로딩 중...</div>;
  }

  if (tasks.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        등록된 작업이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const statusInfo = getStatusLabel(task);
        const successRate = task.runCount > 0 
          ? Math.round((task.successCount / task.runCount) * 100) 
          : 0;

        return (
          <div
            key={task.id}
            className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900">{task.name}</h3>
                  <span className="text-xs text-gray-500">{getTypeLabel(task.type)}</span>
                  <span className={`px-2 py-1 text-xs rounded font-medium ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                {task.description && (
                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                )}

                <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                  <span>
                    <code className="bg-gray-100 px-2 py-1 rounded font-mono">{task.cron}</code>
                  </span>
                  {task.lastRunAt && (
                    <span>
                      마지막 실행: {new Date(task.lastRunAt).toLocaleString("ko-KR")}
                    </span>
                  )}
                  {task.lastRunStatus && (
                    <span className={task.lastRunStatus === "success" ? "text-green-600" : "text-red-600"}>
                      {task.lastRunStatus === "success" ? "✅ 성공" : "❌ 실패"}
                    </span>
                  )}
                </div>

                {task.runCount > 0 && (
                  <div className="mt-2 flex items-center gap-4 text-xs">
                    <span>실행: {task.runCount}회</span>
                    <span>성공: {task.successCount}회</span>
                    <span>실패: {task.failureCount}회</span>
                    <span className={`font-semibold ${successRate >= 80 ? "text-green-600" : successRate >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                      성공률: {successRate}%
                    </span>
                  </div>
                )}

                {task.lastRunError && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <strong>오류:</strong> {task.lastRunError}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 ml-4">
                <button
                  onClick={() => toggleMutation.mutate({ id: task.id, enabled: !task.enabled })}
                  className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                    task.enabled
                      ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                      : "bg-green-100 text-green-800 hover:bg-green-200"
                  }`}
                  disabled={toggleMutation.isPending}
                >
                  {task.enabled ? "⏸️ 일시정지" : "▶️ 활성화"}
                </button>

                <button
                  onClick={() => executeMutation.mutate(task.id)}
                  className="px-3 py-1 text-xs rounded font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors disabled:bg-gray-100 disabled:text-gray-400"
                  disabled={executingTaskId === task.id || executeMutation.isPending}
                >
                  {executingTaskId === task.id ? "실행 중..." : "▶️ 수동 실행"}
                </button>

                <button
                  onClick={() => {
                    if (confirm(`"${task.name}" 작업을 삭제하시겠습니까?`)) {
                      deleteMutation.mutate(task.id);
                    }
                  }}
                  className="px-3 py-1 text-xs rounded font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
                  disabled={deleteMutation.isPending}
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

