# 로그 수집 사용 가이드

## 개요

이 프로젝트는 실제 애플리케이션에서 발생하는 에러를 자동으로 수집하여 `/api/logs/collect`로 전송합니다.

## 자동 수집 기능

### 1. 전역 JavaScript 에러 캐치

JavaScript 에러가 발생하면 자동으로 캐치되어 로그에 기록됩니다.

```javascript
// 예시: 이런 에러가 발생하면 자동으로 로그 수집
undefinedFunction(); // ReferenceError
```

### 2. API 에러 자동 캐치

모든 `fetch` 요청이 인터셉터되어 에러 응답(4xx, 5xx)을 자동으로 로그에 기록합니다.

```javascript
// 예시: API 에러가 자동으로 로그에 기록됨
fetch('/api/users/999')
  .then(res => res.json())
  // 404 응답이면 자동으로 경고 로그 기록
```

### 3. 네트워크 에러 자동 캐치

네트워크 에러(연결 실패, 타임아웃 등)도 자동으로 캐치됩니다.

### 4. React 컴포넌트 에러 캐치

`ErrorBoundary` 컴포넌트가 React 에러를 자동으로 캐치합니다.

## 수동 로그 수집

### 기본 사용법

```javascript
import { logError, logWarning, logInfo, logger } from '@/lib/logger';

// 에러 로그
logError('에러 메시지', error);
// 또는
logger?.error({
  message: '에러 메시지',
  errorCode: '404',
  details: '상세 정보',
  stack: error.stack,
});

// 경고 로그
logWarning('경고 메시지', '상세 정보');

// 정보 로그
logInfo('정보 메시지', '상세 정보');
```

### 실제 사용 예시

#### 1. API 요청 에러 처리

```javascript
async function fetchUserData(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    // 자동으로 로그에 기록됨 (fetch 인터셉터가 처리)
    logError('사용자 데이터 조회 실패', error);
    throw error;
  }
}
```

#### 2. 폼 검증 에러

```javascript
function handleSubmit(formData) {
  try {
    validateForm(formData);
    // ... 제출 처리
  } catch (error) {
    logError('폼 검증 실패', error);
    // 사용자에게 에러 표시
  }
}
```

#### 3. 비즈니스 로직 에러

```javascript
async function processPayment(amount) {
  try {
    // 결제 처리
    if (amount < 0) {
      throw new Error('결제 금액이 유효하지 않습니다.');
    }
    // ...
  } catch (error) {
    logError('결제 처리 실패', error);
    logger?.error({
      message: `결제 실패: ${error.message}`,
      errorCode: 'PAYMENT_ERROR',
      details: { amount, userId: currentUser.id },
    });
  }
}
```

#### 4. 즉시 전송 (배치 대기 없음)

```javascript
// 중요한 에러는 즉시 전송
await logger?.sendImmediate({
  message: '중요한 에러 발생',
  errorCode: 'CRITICAL',
  details: '시스템 재시작 필요',
}, 'error');
```

## API 엔드포인트 사용법

### 다른 애플리케이션에서 로그 전송

```javascript
// 단일 로그 전송
fetch('http://your-server.com/api/logs/collect', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type: 'error',
    message: '에러 메시지',
    errorCode: '404',
    details: '상세 정보',
  })
});

// 여러 로그 한 번에 전송
fetch('http://your-server.com/api/logs/collect', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify([
    {
      type: 'error',
      message: '에러 1',
      errorCode: '404',
    },
    {
      type: 'warning',
      message: '경고',
    },
  ])
});
```

## 로그 배치 처리

로그는 자동으로 배치 처리됩니다:
- **배치 크기**: 10개씩
- **배치 시간**: 5초마다
- **즉시 전송**: `sendImmediate()` 메서드 사용

## 로그 수집 활성화/비활성화

```javascript
import { logger } from '@/lib/logger';

// 로그 수집 비활성화
logger?.disable();

// 로그 수집 활성화
logger?.enable();
```

## 로그 데이터 구조

```typescript
interface LogEntry {
  type: "error" | "warning" | "info" | "debug";
  message: string;
  errorCode?: string;        // HTTP 에러 코드 (404, 500 등) 또는 커스텀 코드
  responseTime?: number;     // 응답 시간 (ms)
  details?: string;          // 상세 정보
  file?: string;             // 파일명 (에러 발생 파일)
  timestamp?: string;        // 타임스탬프
  level?: string;            // 로그 레벨 (ERROR, WARNING, INFO, DEBUG)
  stack?: string;            // 스택 트레이스
}
```

## 확인 방법

1. **로그 페이지** (`/logs`) 접속
2. **통계 대시보드**에서 로그 통계 확인
3. **로그 목록**에서 상세 정보 확인
4. **CSV 다운로드**로 로그 내보내기

## 테스트

`/logs` 페이지의 "실제 에러 로그 테스트" 섹션에서 다양한 에러를 테스트할 수 있습니다:
- JavaScript 에러
- API 에러 (404)
- 네트워크 에러
- 경고/정보 로그
- React 에러 (에러 바운더리 테스트)

