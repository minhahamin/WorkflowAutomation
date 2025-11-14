# 한글 폰트 설정 가이드

## 문제점
현재 `pdfmake`는 기본 Helvetica 폰트를 사용하므로 **한글이 깨집니다**.

## 해결 방법

### 옵션 1: 한글 폰트 추가 (권장)

1. **폰트 파일 다운로드**
   - Noto Sans KR: https://fonts.google.com/noto/specimen/Noto+Sans+KR
   - 나눔고딕: https://hangeul.naver.com/font/nanum
   - 다운로드한 `.ttf` 파일을 `public/fonts/` 폴더에 저장

2. **코드 수정**
   `app/api/ai/save-pdf/route.ts`에서 폰트를 로드:

```typescript
import fs from "fs";
import path from "path";

// 한글 폰트 파일 경로
const fontPath = path.join(process.cwd(), "public", "fonts", "NotoSansKR-Regular.ttf");
const fontBoldPath = path.join(process.cwd(), "public", "fonts", "NotoSansKR-Bold.ttf");

const fonts = {
  NotoSansKR: {
    normal: fs.readFileSync(fontPath),
    bold: fs.readFileSync(fontBoldPath),
    italics: fs.readFileSync(fontPath),
    bolditalics: fs.readFileSync(fontBoldPath),
  },
};
```

### 옵션 2: 간단한 해결 (현재 상태 유지)

- 한글이 깨지더라도 PDF는 생성됩니다
- 영문/숫자/기호는 정상 표시됩니다
- 한글은 나중에 폰트를 추가하면 해결됩니다

## 빠른 테스트
영문 문서로 먼저 테스트해보고, 한글 폰트는 나중에 추가하는 것을 권장합니다.

