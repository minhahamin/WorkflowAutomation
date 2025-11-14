# 🚀 업무 자동화 시스템

Next.js 기반의 업무 자동화 플랫폼입니다. 문서 자동 생성, 로그 분석, 알림 시스템, AI 문서 요약 기능을 제공합니다.

## 📋 주요 기능

### 1. 문서 자동화 PDF/Excel 생성기
- Excel 또는 JSON 파일 업로드
- 템플릿 기반 PDF 자동 생성
- PDF 미리보기 및 다운로드
- 생성 히스토리 관리

### 2. 로그 분석 대시보드
- 로그 파일 업로드 및 자동 수집
- 그래프를 통한 시각화 (Bar/Line Chart)
- 기간별 필터링
- 에러 타입별 통계
- 응답시간 분석
- CSV 다운로드

### 3. 리마인더 / 알림 시스템
- Slack/Email 알림 설정
- 특정 날짜/시간 알림
- 반복 알림 (매일/매주/매월)
- 알림 히스토리 관리

### 4. AI 문서 요약 & 보고서 자동 생성
- 문서 업로드 및 AI 기반 자동 요약
- 핵심 포인트 추출
- 로그 기반 운영 리포트 자동 생성
- PDF로 저장

## 🛠️ 기술 스택

### 프론트엔드
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **React Query** (데이터 페칭)
- **Recharts** (그래프 시각화)
- **React Hook Form** + **Zod** (폼 검증)

### 백엔드 (예정)
- **Next.js API Routes** (간단한 API)
- **NestJS** (확장 가능한 백엔드 API)
- **Python Worker** (문서 처리, AI 처리)
- **BullMQ** (Queue 기반 비동기 작업 처리)
- **PostgreSQL** (데이터베이스)

### 문서 처리
- **openpyxl** (Python) - Excel 파싱
- **reportlab** / **pdfkit** (Python) - PDF 생성
- **pypdf** (Python) - PDF 파싱

### AI 처리
- **OpenAI GPT API** (Node.js 또는 Python)
- Python을 사용하면 더 다양한 AI 라이브러리 활용 가능

## 🤔 AI는 Python으로 해야 하나?

**결론: 둘 다 가능하지만, 상황에 따라 선택**

### Node.js로 가능한 경우
✅ **장점:**
- Next.js와 통합이 쉬움
- 단일 언어 스택으로 개발
- OpenAI API 직접 호출 가능 (`openai` npm 패키지)

✅ **적합한 경우:**
- 간단한 텍스트 요약
- GPT API만 사용
- 빠른 프로토타이핑

### Python으로 해야 하는 경우
✅ **장점:**
- 더 다양한 AI 라이브러리 (Hugging Face, LangChain 등)
- 문서 처리 라이브러리가 풍부
- 머신러닝 모델 직접 사용 가능
- 문서 파싱 (PDF, Excel)이 더 강력

✅ **적합한 경우:**
- 복잡한 문서 분석
- 커스텀 AI 모델 사용
- 대용량 문서 처리
- 이미지/비디오 처리

### 추천 아키텍처
```
Next.js (프론트) 
  ↓
NestJS (API Gateway)
  ↓
Python Worker (문서 처리 + AI) ← Queue를 통해 비동기 처리
```

이 구조의 장점:
1. **성능 분리**: 무거운 작업은 Python Worker에서 처리
2. **확장성**: Worker를 여러 개 띄워서 병렬 처리
3. **안정성**: Worker가 죽어도 API 서버는 영향 없음

## 📦 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.local` 파일을 생성하고 필요한 환경 변수를 설정합니다:

```bash
# .env.example 파일을 복사
cp .env.example .env.local
```

그리고 `.env.local` 파일을 열어 실제 값으로 수정합니다:
- `OPENAI_API_KEY`: OpenAI API 키 (AI 기능 사용 시 필수)
- `SLACK_WEBHOOK_URL`: Slack Webhook URL (알림 기능 사용 시)
- `SMTP_*`: Email SMTP 설정 (Email 알림 사용 시)
- `DATABASE_URL`: PostgreSQL 연결 정보 (데이터 저장 시)
- `REDIS_*`: Redis 연결 정보 (Queue 시스템 사용 시)

### 3. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

## 📁 프로젝트 구조

```
WorkflowAutomation/
├── app/                    # Next.js App Router
│   ├── documents/         # 문서 자동화 페이지
│   ├── logs/              # 로그 분석 페이지
│   ├── reminders/         # 알림 시스템 페이지
│   ├── ai-summary/        # AI 요약 페이지
│   └── api/               # API Routes
├── components/            # React 컴포넌트
│   ├── documents/         # 문서 관련 컴포넌트
│   ├── logs/              # 로그 관련 컴포넌트
│   ├── reminders/         # 알림 관련 컴포넌트
│   └── ai-summary/        # AI 관련 컴포넌트
├── public/                # 정적 파일
└── python-worker/         # Python Worker (예정)
    ├── document_processor.py
    ├── ai_processor.py
    └── requirements.txt
```

## 🔐 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 필요한 환경 변수를 설정하세요:

```bash
cp .env.example .env.local
```

각 기능을 사용하려면 해당하는 환경 변수가 필요합니다:
- **AI 기능**: `OPENAI_API_KEY`
- **Slack 알림**: `SLACK_WEBHOOK_URL`
- **Email 알림**: `SMTP_*` 설정
- **데이터베이스**: `DATABASE_URL`
- **Queue 시스템**: `REDIS_*` 설정

자세한 내용은 [ARCHITECTURE.md](./ARCHITECTURE.md)를 참고하세요.

## 🚧 구현 예정 기능

- [x] 기본 UI 및 페이지 구조
- [x] API Routes 스켈레톤
- [ ] Python Worker 구현
- [ ] Queue 시스템 (BullMQ) 연동
- [ ] 데이터베이스 연동
- [ ] 파일 업로드 처리
- [ ] PDF 템플릿 엔진
- [ ] Slack/Email 알림 구현
- [ ] OpenAI API 연동

## 📝 라이센스

MIT

