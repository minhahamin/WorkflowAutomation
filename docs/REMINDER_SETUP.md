# 리마인더/알림 시스템 설정 가이드

## 이메일 알림 설정 (Gmail 사용 시)

### 1. Gmail 2단계 인증 활성화

1. [Google 계정 보안](https://myaccount.google.com/security) 페이지 접속
2. "2단계 인증" 섹션에서 활성화
3. 설정 완료

### 2. 앱 비밀번호 생성

1. [Google 계정 보안](https://myaccount.google.com/security) 페이지 접속
2. "앱 비밀번호" 섹션 클릭
   - 또는 직접: https://myaccount.google.com/apppasswords
3. "앱 선택" → "메일" 선택
4. "기기 선택" → "기타(맞춤 이름)" 선택
   - 이름 입력: "업무 자동화 시스템" 또는 원하는 이름
5. "생성" 버튼 클릭
6. **16자리 앱 비밀번호 복사** (띄어쓰기 없이)

### 3. 환경 변수 설정

`.env.local` 파일에 추가:

```env
# Email SMTP 설정 (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # 앱 비밀번호 (16자리, 띄어쓰기 없이 입력)
```

**중요:**
- `SMTP_USER`: 본인의 Gmail 주소
- `SMTP_PASS`: **일반 비밀번호가 아닌 앱 비밀번호** 사용
- 앱 비밀번호는 띄어쓰기 없이 입력

### 4. 서버 재시작

환경 변수를 변경한 후 개발 서버를 재시작하세요:

```bash
# 개발 서버 중지 (Ctrl+C)
npm run dev
```

## Slack 알림 설정

### 1. Slack Webhook URL 생성

1. [Slack Apps](https://api.slack.com/apps) 페이지 접속
2. "Create New App" 클릭
3. "Incoming Webhooks" 활성화
4. "Add New Webhook to Workspace" 클릭
5. 채널 선택
6. **Webhook URL 복사**

### 2. 환경 변수 설정 (선택사항)

전역 Slack Webhook URL을 사용하려면 `.env.local`에 추가:

```env
# Slack (선택사항 - 알림 등록 시마다 URL 입력 가능)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

또는 알림 등록 시마다 Webhook URL을 직접 입력할 수 있습니다.

## 다른 이메일 서비스 사용하기

### Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### 네이버 메일

```env
SMTP_HOST=smtp.naver.com
SMTP_PORT=587
SMTP_USER=your-email@naver.com
SMTP_PASS=your-password
```

### 네이버 비즈니스 메일

```env
SMTP_HOST=smtp.naver.com
SMTP_PORT=465
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-password
```

## 문제 해결

### 오류: "Invalid login: 534-5.7.9 Application-specific password required"

**원인:** Gmail 2단계 인증이 활성화되어 있지만 일반 비밀번호를 사용함

**해결:**
1. 앱 비밀번호 생성 (위 참조)
2. `.env.local`의 `SMTP_PASS`를 앱 비밀번호로 변경
3. 서버 재시작

### 오류: "SMTP 설정이 필요합니다"

**원인:** 환경 변수가 설정되지 않음

**해결:**
1. `.env.local` 파일 확인
2. `SMTP_USER`와 `SMTP_PASS`가 올바르게 설정되었는지 확인
3. 서버 재시작

### 오류: "Slack 전송 실패"

**원인:** Webhook URL이 잘못되었거나 만료됨

**해결:**
1. Slack Webhook URL 확인
2. 새로 생성한 URL로 변경
3. 알림을 다시 등록

## 테스트

1. `/reminders` 페이지 접속
2. 테스트 알림 등록:
   - 제목: "테스트 알림"
   - 메시지: "이것은 테스트입니다"
   - 알림 시간: 현재 시간보다 1-2분 후
   - 채널: Email 또는 Slack 선택
3. 시간이 되면 자동 전송 확인

