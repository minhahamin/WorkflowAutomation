"use client";

import Link from "next/link";
import ReminderList from "@/components/reminders/ReminderList";
import ReminderForm from "@/components/reminders/ReminderForm";

export default function RemindersPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← 홈으로
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🔔 리마인더 / 알림 시스템
          </h1>
          <p className="text-gray-600">
            Slack/Email 알림을 설정하고 관리합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 알림 등록 폼 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                알림 등록
              </h2>
              <ReminderForm />
            </div>
          </div>

          {/* 알림 리스트 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                알림 목록
              </h2>
              <ReminderList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

