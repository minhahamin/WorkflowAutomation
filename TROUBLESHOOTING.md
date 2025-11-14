# 문제 해결 가이드

## API 라우트 404 오류

`/api/ai/save-pdf` 엔드포인트에 404 오류가 발생하는 경우:

### 해결 방법

1. **개발 서버 재시작** (가장 빠른 방법)
   ```bash
   # 터미널에서 Ctrl+C로 서버 중지 후
   npm run dev
   ```

2. **빌드 캐시 삭제 후 재시작**
   ```bash
   # Windows PowerShell
   Remove-Item -Recurse -Force .next
   npm run dev
   
   # 또는 수동으로 .next 폴더 삭제 후
   npm run dev
   ```

3. **파일 구조 확인**
   - 파일 경로: `app/api/ai/save-pdf/route.ts`
   - 파일에 `export async function POST` 함수가 있어야 함

### 확인 사항

- [ ] 파일이 `app/api/ai/save-pdf/route.ts` 경로에 존재하는가?
- [ ] `export async function POST` 함수가 있는가?
- [ ] 개발 서버가 실행 중인가?
- [ ] 브라우저에서 `http://localhost:3000/api/ai/save-pdf`로 접근할 수 있는가?

