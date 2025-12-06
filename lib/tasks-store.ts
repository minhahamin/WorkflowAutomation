// 작업 스케줄러 데이터 저장소 (파일 시스템 기반)
import fs from "fs";
import path from "path";

export type TaskType = "email" | "webhook" | "report" | "custom";
export type TaskStatus = "active" | "paused" | "failed";

export interface Task {
  id: string;
  name: string;
  description?: string;
  type: TaskType;
  cron: string; // CRON 표현식
  enabled: boolean;
  status: TaskStatus;
  config: TaskConfig;
  lastRunAt?: string;
  lastRunStatus?: "success" | "failed";
  lastRunError?: string;
  nextRunAt?: string;
  runCount: number;
  successCount: number;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTaskConfig {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}

export interface WebhookTaskConfig {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
}

export interface ReportTaskConfig {
  reportType: "log-summary" | "document-summary" | "system-status";
  emailTo?: string;
  slackWebhook?: string;
}

export interface CustomTaskConfig {
  script: string;
  params?: Record<string, any>;
}

export type TaskConfig = EmailTaskConfig | WebhookTaskConfig | ReportTaskConfig | CustomTaskConfig;

export interface TaskExecution {
  id: string;
  taskId: string;
  status: "success" | "failed";
  startedAt: string;
  completedAt?: string;
  duration?: number; // ms
  error?: string;
  result?: any;
}

// 파일 경로
const TASKS_FILE_PATH = path.join(process.cwd(), "data", "tasks.json");
const EXECUTIONS_FILE_PATH = path.join(process.cwd(), "data", "task-executions.json");

// 파일이 없으면 생성
function ensureFiles() {
  const dir = path.dirname(TASKS_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(TASKS_FILE_PATH)) {
    fs.writeFileSync(TASKS_FILE_PATH, JSON.stringify([], null, 2), "utf-8");
  }
  if (!fs.existsSync(EXECUTIONS_FILE_PATH)) {
    fs.writeFileSync(EXECUTIONS_FILE_PATH, JSON.stringify([], null, 2), "utf-8");
  }
}

// 작업 읽기
function loadTasks(): Task[] {
  try {
    ensureFiles();
    const content = fs.readFileSync(TASKS_FILE_PATH, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("작업 파일 읽기 오류:", error);
    return [];
  }
}

// 작업 저장
function saveTasks(tasks: Task[]): void {
  try {
    ensureFiles();
    fs.writeFileSync(TASKS_FILE_PATH, JSON.stringify(tasks, null, 2), "utf-8");
  } catch (error) {
    console.error("작업 파일 저장 오류:", error);
  }
}

// 실행 히스토리 읽기
function loadExecutions(): TaskExecution[] {
  try {
    ensureFiles();
    const content = fs.readFileSync(EXECUTIONS_FILE_PATH, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("실행 히스토리 파일 읽기 오류:", error);
    return [];
  }
}

// 실행 히스토리 저장
function saveExecutions(executions: TaskExecution[]): void {
  try {
    ensureFiles();
    // 최근 1000개만 저장 (성능 고려)
    const recent = executions.slice(-1000);
    fs.writeFileSync(EXECUTIONS_FILE_PATH, JSON.stringify(recent, null, 2), "utf-8");
  } catch (error) {
    console.error("실행 히스토리 파일 저장 오류:", error);
  }
}

// 작업 추가
export function addTask(task: Omit<Task, "id" | "status" | "runCount" | "successCount" | "failureCount" | "createdAt" | "updatedAt">): Task {
  const tasks = loadTasks();
  const newTask: Task = {
    ...task,
    id: `task-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    status: task.enabled ? "active" : "paused",
    runCount: 0,
    successCount: 0,
    failureCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tasks.push(newTask);
  saveTasks(tasks);
  return newTask;
}

// 모든 작업 조회
export function getAllTasks(): Task[] {
  return loadTasks();
}

// 활성화된 작업만 조회 (스케줄러용)
export function getActiveTasks(): Task[] {
  const tasks = loadTasks();
  return tasks.filter((task) => task.enabled && task.status === "active");
}

// ID로 작업 조회
export function getTaskById(id: string): Task | undefined {
  const tasks = loadTasks();
  return tasks.find((t) => t.id === id);
}

// 작업 업데이트
export function updateTask(id: string, updates: Partial<Task>): Task | null {
  const tasks = loadTasks();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;

  // enabled 상태 변경 시 status 업데이트
  if (updates.enabled !== undefined) {
    updates.status = updates.enabled ? "active" : "paused";
  }

  tasks[index] = {
    ...tasks[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveTasks(tasks);
  return tasks[index];
}

// 작업 삭제
export function deleteTask(id: string): boolean {
  const tasks = loadTasks();
  const filtered = tasks.filter((t) => t.id !== id);
  if (filtered.length === tasks.length) return false;

  saveTasks(filtered);
  return true;
}

// 작업 실행 기록 추가
export function addExecution(execution: Omit<TaskExecution, "id">): TaskExecution {
  const executions = loadExecutions();
  const newExecution: TaskExecution = {
    ...execution,
    id: `exec-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  };
  executions.push(newExecution);
  saveExecutions(executions);

  // 작업 통계 업데이트
  const task = getTaskById(execution.taskId);
  if (task) {
    const updates: Partial<Task> = {
      lastRunAt: execution.startedAt,
      lastRunStatus: execution.status,
      lastRunError: execution.error,
      runCount: task.runCount + 1,
    };

    if (execution.status === "success") {
      updates.successCount = task.successCount + 1;
      updates.status = "active";
    } else {
      updates.failureCount = task.failureCount + 1;
      // 연속 실패 3회 이상 시 자동 비활성화
      if (task.failureCount + 1 >= 3) {
        updates.status = "failed";
        updates.enabled = false;
      }
    }

    updateTask(execution.taskId, updates);
  }

  return newExecution;
}

// 작업 실행 히스토리 조회
export function getTaskExecutions(taskId?: string, limit: number = 50): TaskExecution[] {
  const executions = loadExecutions();
  let filtered = executions;

  if (taskId) {
    filtered = executions.filter((e) => e.taskId === taskId);
  }

  // 최신순 정렬
  filtered.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  return filtered.slice(0, limit);
}

// 다음 실행 시간 계산 (간단한 CRON 파싱)
export function calculateNextRun(cron: string, from: Date = new Date()): Date | null {
  // 간단한 CRON 패턴만 지원: 분 시 일 월 요일
  // 예: "0 9 * * *" = 매일 9시
  // 예: "0 0 * * 0" = 매주 일요일 자정
  // 예: "*/5 * * * *" = 5분마다
  
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) {
    return null; // 잘못된 형식
  }

  const [minute, hour, day, month, weekday] = parts;
  const next = new Date(from);
  next.setSeconds(0, 0);

  // 간단한 구현: 현재 시간에서 1시간 후로 설정 (정확한 CRON 파싱은 라이브러리 필요)
  // 실제 운영에서는 cron-parser 라이브러리 사용 권장
  next.setMinutes(next.getMinutes() + 1);

  return next;
}

