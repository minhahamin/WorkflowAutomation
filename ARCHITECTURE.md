# 🏗️ 아키텍처 설계

## 환경 변수 구조

이 프로젝트는 여러 외부 서비스와 연동하기 위해 환경 변수를 사용합니다.

### 필수 환경 변수

현재는 모든 기능이 선택사항이지만, 각 기능을 사용하려면 다음 환경 변수가 필요합니다:

#### 1. AI 기능 사용 시
```env
OPENAI_API_KEY=sk-...  # OpenAI API 키 (필수)
```

#### 2. Slack 알림 사용 시
```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...  # Slack Webhook URL (필수)
```

#### 3. Email 알림 사용 시
```env
SMTP_HOST=smtp.gmail.com  # SMTP 서버 주소 (필수)
SMTP_PORT=587            # SMTP 포트 (필수)
SMTP_USER=your-email@gmail.com  # SMTP 사용자명 (필수)
SMTP_PASS=your-app-password     # SMTP 비밀번호 (필수)
```

### 선택적 환경 변수

#### 데이터베이스 (데이터 저장 시)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/workflow_automation
```

#### Redis (Queue 시스템 사용 시)
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

#### Python Worker (별도 서버로 실행 시)
```env
PYTHON_WORKER_URL=http://localhost:8000
```

#### Next.js 공개 환경 변수
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 환경 변수 사용 패턴

### 서버 사이드 (API Routes)
```typescript
// Next.js API Routes에서 사용
const apiKey = process.env.OPENAI_API_KEY;
```

### 클라이언트 사이드
```typescript
// NEXT_PUBLIC_ 접두사가 있는 변수만 클라이언트에서 접근 가능
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
```

## 보안 주의사항

1. **절대 `.env.local` 파일을 Git에 커밋하지 마세요**
   - `.gitignore`에 이미 포함되어 있습니다

2. **프로덕션 환경에서는 환경 변수를 안전하게 관리하세요**
   - Vercel, AWS, 등 플랫폼의 환경 변수 설정 사용
   - 비밀번호 관리 도구 사용

3. **민감한 정보는 클라이언트에 노출하지 마세요**
   - `NEXT_PUBLIC_` 접두사는 클라이언트 번들에 포함됩니다
   - API 키 등은 절대 `NEXT_PUBLIC_`로 시작하지 마세요

## 환경 변수 설정 방법

### 로컬 개발
1. `.env.example` 파일을 `.env.local`로 복사
2. 실제 값으로 수정
3. 서버 재시작

### 프로덕션 (Vercel 예시)
1. Vercel Dashboard → Settings → Environment Variables
2. 환경 변수 추가
3. 자동으로 재배포

## 기능별 필수 환경 변수

| 기능 | 필수 환경 변수 | 선택적 |
|------|--------------|--------|
| AI 문서 요약 | `OPENAI_API_KEY` | `PYTHON_WORKER_URL` |
| Slack 알림 | `SLACK_WEBHOOK_URL` | - |
| Email 알림 | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | - |
| 데이터 저장 | `DATABASE_URL` | - |
| Queue 시스템 | `REDIS_HOST`, `REDIS_PORT` | `REDIS_PASSWORD` |

