# 한글 폰트 설정 가이드

`pdfmake`에서 한글을 올바르게 표시하려면 한글 폰트를 추가해야 합니다.

## 방법 1: Noto Sans KR 폰트 사용 (권장)

### 1. 폰트 파일 다운로드
Noto Sans KR 폰트를 다운로드:
- https://fonts.google.com/noto/specimen/Noto+Sans+KR
- 또는 다음 명령어로 다운로드:

### 2. 폰트 파일을 프로젝트에 추가
```
public/fonts/
  ├── NotoSansKR-Regular.ttf
  ├── NotoSansKR-Bold.ttf
  └── ...
```

### 3. 코드에 폰트 추가
`app/api/ai/save-pdf/route.ts`에서 폰트를 로드하고 추가:

```typescript
import fs from "fs";
import path from "path";

// 폰트 파일 로드
const fontPath = path.join(process.cwd(), "public", "fonts", "NotoSansKR-Regular.ttf");
const fontBoldPath = path.join(process.cwd(), "public", "fonts", "NotoSansKR-Bold.ttf");

const fonts = {
  NotoSansKR: {
    normal: fontPath,
    bold: fontBoldPath,
    italics: fontPath,
    bolditalics: fontBoldPath,
  },
};

const printer = new PdfPrinter(fonts);

// 문서 정의에서 폰트 사용
const docDefinition = {
  defaultStyle: {
    font: "NotoSansKR", // 한글 폰트 사용
    fontSize: 10,
  },
  // ...
};
```

## 방법 2: 간단한 해결책 (임시)

한글이 깨지는 경우, 텍스트를 영문/숫자로만 변환하거나,
한글을 유니코드로 변환하는 방법을 사용할 수 있습니다.

## 참고

- pdfmake는 내부적으로 pdfkit을 사용하므로 폰트 경로 문제가 있을 수 있습니다.
- 한글 폰트 파일은 용량이 크므로 필요시에만 추가하는 것을 권장합니다.

