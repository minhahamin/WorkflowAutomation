"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Reminder {
  id: string;
  title: string;
  message: string;
  scheduledAt: string;
  channel: string;
  repeat: string;
  status: "pending" | "sent" | "failed";
  lastSentAt?: string;
}

export default function ReminderList() {
  const queryClient = useQueryClient();

  const { data: reminders, isLoading } = useQuery<Reminder[]>({
    queryKey: ["reminders"],
    queryFn: async () => {
      const response = await fetch("/api/reminders");
      if (!response.ok) throw new Error("알림 조회 실패");
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/reminders/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("삭제 실패");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });

  if (isLoading) {
    return <div className="text-gray-600">로딩 중...</div>;
  }

  if (!reminders || reminders.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        등록된 알림이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reminders.map((reminder) => (
        <div
          key={reminder.id}
          className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">{reminder.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{reminder.message}</p>
              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                <span>📅 {new Date(reminder.scheduledAt).toLocaleString("ko-KR")}</span>
                <span>📢 {reminder.channel}</span>
                {reminder.repeat !== "none" && (
                  <span>🔄 {reminder.repeat === "daily" ? "매일" : reminder.repeat === "weekly" ? "매주" : "매월"}</span>
                )}
              </div>
              {reminder.lastSentAt && (
                <p className="text-xs text-gray-400 mt-1">
                  마지막 전송: {new Date(reminder.lastSentAt).toLocaleString("ko-KR")}
                </p>
              )}
              {reminder.status === "pending" && (
                <p className="text-xs text-yellow-600 mt-1">
                  {new Date(reminder.scheduledAt) > new Date() 
                    ? `⏰ 전송 예정: ${new Date(reminder.scheduledAt).toLocaleString("ko-KR")}`
                    : "⏳ 전송 대기 중 (곧 전송됩니다)"}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <span
                className={`px-2 py-1 text-xs rounded font-medium ${
                  reminder.status === "sent"
                    ? "bg-green-100 text-green-800"
                    : reminder.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
                title={
                  reminder.status === "pending"
                    ? new Date(reminder.scheduledAt) > new Date()
                      ? `전송 예정 시간: ${new Date(reminder.scheduledAt).toLocaleString("ko-KR")}`
                      : "전송 대기 중 - 스케줄러가 곧 전송합니다"
                    : reminder.status === "sent"
                    ? `마지막 전송: ${reminder.lastSentAt ? new Date(reminder.lastSentAt).toLocaleString("ko-KR") : "알 수 없음"}`
                    : "전송 실패"
                }
              >
                {reminder.status === "sent" 
                  ? "✅ 전송됨" 
                  : reminder.status === "pending" 
                  ? (new Date(reminder.scheduledAt) > new Date() ? "⏰ 대기중" : "⏳ 전송중") 
                  : "❌ 실패"}
              </span>
              <button
                onClick={() => deleteMutation.mutate(reminder.id)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

