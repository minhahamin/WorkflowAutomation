// 문서 생성 히스토리 저장소 (파일 시스템 기반)
import fs from "fs";
import path from "path";

interface DocumentHistoryItem {
  id: string;
  template: string;
  templateId: string; // 템플릿 ID (order, report, checklist 등)
  fileName: string;
  createdAt: string;
  createdBy: string;
  status: "success" | "processing" | "failed";
  pdfUrl?: string; // 생성된 PDF URL (Base64 Data URL)
}

// 히스토리 파일 경로
const HISTORY_FILE_PATH = path.join(process.cwd(), "data", "documents-history.json");

// 파일이 없으면 생성
function ensureHistoryFile() {
  const dir = path.dirname(HISTORY_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(HISTORY_FILE_PATH)) {
    fs.writeFileSync(HISTORY_FILE_PATH, JSON.stringify([], null, 2), "utf-8");
  }
}

// 히스토리 읽기
function loadHistory(): DocumentHistoryItem[] {
  try {
    ensureHistoryFile();
    const content = fs.readFileSync(HISTORY_FILE_PATH, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("히스토리 파일 읽기 오류:", error);
    return [];
  }
}

// 히스토리 저장
function saveHistory(history: DocumentHistoryItem[]): void {
  try {
    ensureHistoryFile();
    fs.writeFileSync(HISTORY_FILE_PATH, JSON.stringify(history, null, 2), "utf-8");
  } catch (error) {
    console.error("히스토리 파일 저장 오류:", error);
  }
}

// 히스토리 추가
export function addDocumentHistory(entry: Omit<DocumentHistoryItem, "id" | "createdAt">): DocumentHistoryItem {
  const history = loadHistory();
  const newEntry: DocumentHistoryItem = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
    createdAt: new Date().toISOString(),
  };
  history.unshift(newEntry); // 최신순으로 추가
  saveHistory(history);
  return newEntry;
}

// 히스토리 조회 (템플릿 필터링 지원)
export function getDocumentHistory(templateId?: string): DocumentHistoryItem[] {
  let history = loadHistory();

  // 템플릿 ID로 필터링
  if (templateId && templateId !== "") {
    history = history.filter((item) => item.templateId === templateId);
  }

  // 최신순 정렬 (이미 unshift로 추가했지만 확실히)
  return history.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// 템플릿 이름 매핑
export function getTemplateName(templateId: string): string {
  const templateMap: Record<string, string> = {
    order: "발주서",
    report: "보고서",
    checklist: "체크리스트",
    invoice: "인보이스",
    contract: "계약서",
    custom: "커스텀",
  };
  return templateMap[templateId] || templateId;
}

