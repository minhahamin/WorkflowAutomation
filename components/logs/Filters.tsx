"use client";

interface LogFiltersProps {
  filters: {
    startDate: string;
    endDate: string;
    logType: string;
    keyword: string;
  };
  onFiltersChange: (filters: typeof LogFiltersProps.prototype.filters) => void;
}

export default function LogFilters({ filters, onFiltersChange }: LogFiltersProps) {
  const handleChange = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">필터</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            시작 날짜
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleChange("startDate", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            종료 날짜
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleChange("endDate", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            로그 타입
          </label>
          <select
            value={filters.logType}
            onChange={(e) => handleChange("logType", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">전체</option>
            <option value="error">에러</option>
            <option value="warning">경고</option>
            <option value="info">정보</option>
            <option value="debug">디버그</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            키워드 검색
          </label>
          <input
            type="text"
            value={filters.keyword}
            onChange={(e) => handleChange("keyword", e.target.value)}
            placeholder="검색어 입력..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}

