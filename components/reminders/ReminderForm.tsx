"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";

const reminderSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요."),
  message: z.string().min(1, "메시지를 입력해주세요."),
  scheduledAt: z.string().min(1, "날짜/시간을 선택해주세요."),
  channel: z.enum(["slack", "email", "both"]),
  repeat: z.enum(["none", "daily", "weekly", "monthly"]),
  slackWebhook: z.string().optional(),
  email: z.string().email("올바른 이메일을 입력해주세요.").optional(),
}).refine((data) => {
  if (data.channel === "slack" || data.channel === "both") {
    return !!data.slackWebhook;
  }
  return true;
}, {
  message: "Slack Webhook URL을 입력해주세요.",
  path: ["slackWebhook"],
}).refine((data) => {
  if (data.channel === "email" || data.channel === "both") {
    return !!data.email;
  }
  return true;
}, {
  message: "이메일 주소를 입력해주세요.",
  path: ["email"],
});

type ReminderFormData = z.infer<typeof reminderSchema>;

export default function ReminderForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
  });

  const channel = watch("channel");

  const onSubmit = async (data: ReminderFormData) => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "알림 등록 실패");
      }

      setMessage("✅ 알림이 성공적으로 등록되었습니다.");
      reset();
      
      // 리마인더 목록 새로고침
      await queryClient.invalidateQueries({ queryKey: ["reminders"] });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "알림 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          제목 *
        </label>
        <input
          type="text"
          {...register("title")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          메시지 *
        </label>
        <textarea
          {...register("message")}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.message && (
          <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          알림 시간 *
        </label>
        <input
          type="datetime-local"
          {...register("scheduledAt")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.scheduledAt && (
          <p className="mt-1 text-sm text-red-600">{errors.scheduledAt.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          알림 채널 *
        </label>
        <select
          {...register("channel")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="slack">Slack</option>
          <option value="email">Email</option>
          <option value="both">Slack + Email</option>
        </select>
      </div>

      {(channel === "slack" || channel === "both") && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Slack Webhook URL *
          </label>
          <input
            type="url"
            {...register("slackWebhook")}
            placeholder="https://hooks.slack.com/services/..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.slackWebhook && (
            <p className="mt-1 text-sm text-red-600">{errors.slackWebhook.message}</p>
          )}
        </div>
      )}

      {(channel === "email" || channel === "both") && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            이메일 주소 *
          </label>
          <input
            type="email"
            {...register("email")}
            placeholder="example@company.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          반복 설정
        </label>
        <select
          {...register("repeat")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="none">반복 없음</option>
          <option value="daily">매일</option>
          <option value="weekly">매주</option>
          <option value="monthly">매월</option>
        </select>
      </div>

      {message && (
        <div className={`p-3 rounded-lg ${message.includes("성공") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
          <p className="text-sm">{message}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold
          hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
          transition-colors"
      >
        {isSubmitting ? "등록 중..." : "알림 등록"}
      </button>
    </form>
  );
}

