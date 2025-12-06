"use client";

import { useState } from "react";
import TaskForm from "@/components/tasks/TaskForm";
import TaskList from "@/components/tasks/TaskList";

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ⏰ 작업 스케줄러
          </h1>
          <p className="text-gray-600">
            CRON 표현식으로 반복 작업을 자동으로 실행합니다.
          </p>
        </div>

        {/* 탭 메뉴 */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("list")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "list"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              📋 작업 목록
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "create"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              ➕ 작업 생성
            </button>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {activeTab === "list" ? (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-900">작업 목록</h2>
                <button
                  onClick={() => setActiveTab("create")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ➕ 새 작업
                </button>
              </div>
              <TaskList />
            </div>
          ) : (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-900">작업 생성</h2>
                <button
                  onClick={() => setActiveTab("list")}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  ← 목록으로
                </button>
              </div>
              <TaskForm />
            </div>
          )}
        </div>

        {/* 정보 섹션 */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            ℹ️ 작업 스케줄러 사용 안내
          </h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">📅 CRON 표현식</h3>
              <p>
                CRON 표현식은 <code className="bg-gray-100 px-1 rounded">분 시 일 월 요일</code> 형식입니다.
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><code className="bg-gray-100 px-1 rounded">0 9 * * *</code> = 매일 9시</li>
                <li><code className="bg-gray-100 px-1 rounded">*/5 * * * *</code> = 5분마다</li>
                <li><code className="bg-gray-100 px-1 rounded">0 0 1 * *</code> = 매월 1일 자정</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-1">📧 이메일 작업</h3>
              <p>
                SMTP 환경 변수가 설정되어 있어야 합니다. (.env.local 파일 참고)
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-1">🔗 웹훅 작업</h3>
              <p>
                외부 API를 호출하여 작업을 트리거할 수 있습니다. POST, GET, PUT, DELETE 메서드를 지원합니다.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-1">📊 리포트 작업</h3>
              <p>
                로그 요약, 문서 생성 요약, 시스템 상태 등의 리포트를 자동으로 생성하고 전송합니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

