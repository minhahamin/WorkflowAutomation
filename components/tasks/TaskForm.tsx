"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";

const taskSchema = z.object({
  name: z.string().min(1, "작업 이름은 필수입니다."),
  description: z.string().optional(),
  type: z.enum(["email", "webhook", "report", "custom"]),
  cron: z.string().min(1, "CRON 표현식은 필수입니다."),
  enabled: z.boolean().default(true),
  config: z.record(z.any()),
}).refine((data) => {
  if (data.type === "email") {
    return data.config?.to && data.config?.subject && data.config?.body;
  }
  if (data.type === "webhook") {
    return data.config?.url;
  }
  if (data.type === "report") {
    return data.config?.reportType;
  }
  return true;
}, {
  message: "작업 타입에 맞는 설정을 입력해주세요.",
});

type TaskFormData = z.infer<typeof taskSchema>;

const CRON_EXAMPLES = [
  { label: "매 분", value: "* * * * *" },
  { label: "매 5분", value: "*/5 * * * *" },
  { label: "매 시간 (0분)", value: "0 * * * *" },
  { label: "매일 9시", value: "0 9 * * *" },
  { label: "매일 오후 6시", value: "0 18 * * *" },
  { label: "매주 월요일 9시", value: "0 9 * * 1" },
  { label: "매월 1일 자정", value: "0 0 1 * *" },
];

export default function TaskForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      type: "email",
      enabled: true,
      cron: "0 9 * * *",
      config: {},
    },
  });

  const taskType = watch("type");

  const onSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      // 설정 객체 구성
      let config: any = {};

      if (data.type === "email") {
        config = {
          to: (data.config as any).to,
          subject: (data.config as any).subject,
          body: (data.config as any).body,
          isHtml: (data.config as any).isHtml || false,
        };
      } else if (data.type === "webhook") {
        config = {
          url: (data.config as any).url,
          method: (data.config as any).method || "POST",
          headers: (data.config as any).headers ? JSON.parse((data.config as any).headers) : {},
          body: (data.config as any).body ? JSON.parse((data.config as any).body) : undefined,
        };
      } else if (data.type === "report") {
        config = {
          reportType: (data.config as any).reportType,
          emailTo: (data.config as any).emailTo,
          slackWebhook: (data.config as any).slackWebhook,
        };
      }

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          config,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "작업 등록 실패");
      }

      setMessage("✅ 작업이 성공적으로 등록되었습니다.");
      reset();
      
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "작업 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          작업 이름 *
        </label>
        <input
          type="text"
          {...register("name")}
          placeholder="예: 매일 아침 리포트 발송"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          설명 (선택)
        </label>
        <textarea
          {...register("description")}
          rows={2}
          placeholder="작업에 대한 설명을 입력하세요"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          작업 타입 *
        </label>
        <select
          {...register("type")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="email">이메일 발송</option>
          <option value="webhook">웹훅 호출</option>
          <option value="report">리포트 생성</option>
          <option value="custom">커스텀 작업</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          CRON 표현식 *
          <span className="text-xs text-gray-500 ml-2">(분 시 일 월 요일)</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            {...register("cron")}
            placeholder="0 9 * * *"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            onChange={(e) => {
              if (e.target.value) {
                setValue("cron", e.target.value);
              }
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">예시 선택...</option>
            {CRON_EXAMPLES.map((ex) => (
              <option key={ex.value} value={ex.value}>
                {ex.label} ({ex.value})
              </option>
            ))}
          </select>
        </div>
        {errors.cron && (
          <p className="mt-1 text-sm text-red-600">{errors.cron.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          예: <code className="bg-gray-100 px-1 rounded">0 9 * * *</code> = 매일 9시 실행
        </p>
      </div>

      {/* 이메일 설정 */}
      {taskType === "email" && (
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-gray-900">이메일 설정</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              수신자 이메일 *
            </label>
            <input
              type="email"
              {...register("config.to")}
              placeholder="recipient@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목 *
            </label>
            <input
              type="text"
              {...register("config.subject")}
              placeholder="이메일 제목"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              내용 *
            </label>
            <textarea
              {...register("config.body")}
              rows={6}
              placeholder="이메일 내용"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register("config.isHtml")}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">HTML 형식 사용</span>
            </label>
          </div>
        </div>
      )}

      {/* 웹훅 설정 */}
      {taskType === "webhook" && (
        <div className="space-y-4 p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-gray-900">웹훅 설정</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL *
            </label>
            <input
              type="url"
              {...register("config.url")}
              placeholder="https://api.example.com/webhook"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              HTTP 메서드
            </label>
            <select
              {...register("config.method")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              헤더 (JSON 형식, 선택)
            </label>
            <textarea
              {...register("config.headers")}
              rows={3}
              placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              요청 본문 (JSON 형식, 선택)
            </label>
            <textarea
              {...register("config.body")}
              rows={4}
              placeholder='{"key": "value"}'
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>
        </div>
      )}

      {/* 리포트 설정 */}
      {taskType === "report" && (
        <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
          <h3 className="font-semibold text-gray-900">리포트 설정</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              리포트 타입 *
            </label>
            <select
              {...register("config.reportType")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="log-summary">로그 요약</option>
              <option value="document-summary">문서 생성 요약</option>
              <option value="system-status">시스템 상태</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이메일 수신자 (선택)
            </label>
            <input
              type="email"
              {...register("config.emailTo")}
              placeholder="report@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slack Webhook URL (선택)
            </label>
            <input
              type="url"
              {...register("config.slackWebhook")}
              placeholder="https://hooks.slack.com/services/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            {...register("enabled")}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">작업 활성화</span>
        </label>
      </div>

      {message && (
        <div className={`p-3 rounded-lg ${message.includes("성공") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
          <p className="text-sm">{message}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? "등록 중..." : "작업 등록"}
      </button>
    </form>
  );
}

