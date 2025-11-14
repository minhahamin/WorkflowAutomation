import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🚀 업무 자동화 시스템
          </h1>
          <p className="text-xl text-gray-600">
            문서 생성, 로그 분석, 알림 관리까지 한 곳에서
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 문서 자동화 */}
          <Link href="/documents" className="group">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 h-full">
              <div className="text-4xl mb-4">📄</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                문서 자동화
              </h2>
              <p className="text-gray-600 mb-4">
                Excel/JSON 기반 PDF 자동 생성
              </p>
              <div className="text-sm text-blue-600 group-hover:text-blue-800">
                시작하기 →
              </div>
            </div>
          </Link>

          {/* 로그 분석 */}
          <Link href="/logs" className="group">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 h-full">
              <div className="text-4xl mb-4">📊</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                로그 분석
              </h2>
              <p className="text-gray-600 mb-4">
                로그 시각화 및 통계 분석
              </p>
              <div className="text-sm text-blue-600 group-hover:text-blue-800">
                시작하기 →
              </div>
            </div>
          </Link>

          {/* 알림 시스템 */}
          <Link href="/reminders" className="group">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 h-full">
              <div className="text-4xl mb-4">🔔</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                알림 시스템
              </h2>
              <p className="text-gray-600 mb-4">
                Slack/Email 알림 및 리마인더
              </p>
              <div className="text-sm text-blue-600 group-hover:text-blue-800">
                시작하기 →
              </div>
            </div>
          </Link>

          {/* AI 문서 요약 */}
          <Link href="/ai-summary" className="group">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 h-full">
              <div className="text-4xl mb-4">🤖</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                AI 문서 요약
              </h2>
              <p className="text-gray-600 mb-4">
                AI 기반 문서 요약 및 보고서 생성
              </p>
              <div className="text-sm text-blue-600 group-hover:text-blue-800">
                시작하기 →
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            📋 주요 기능
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <h3 className="font-semibold text-gray-900">템플릿 기반 PDF 생성</h3>
                <p className="text-gray-600 text-sm">Excel/JSON 데이터를 PDF로 자동 변환</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <h3 className="font-semibold text-gray-900">실시간 로그 분석</h3>
                <p className="text-gray-600 text-sm">그래프와 통계로 로그 데이터 시각화</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <h3 className="font-semibold text-gray-900">스마트 알림 시스템</h3>
                <p className="text-gray-600 text-sm">Slack/Email로 자동 알림 전송</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <h3 className="font-semibold text-gray-900">AI 기반 자동 요약</h3>
                <p className="text-gray-600 text-sm">GPT를 활용한 문서 요약 및 보고서 생성</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

