// 리마인더 데이터 저장소 (파일 시스템 기반)
import fs from "fs";
import path from "path";

interface Reminder {
  id: string;
  title: string;
  message: string;
  scheduledAt: string; // ISO string
  channel: "slack" | "email" | "both";
  repeat: "none" | "daily" | "weekly" | "monthly";
  slackWebhook?: string;
  email?: string;
  status: "pending" | "sent" | "failed";
  lastSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 리마인더 파일 경로
const REMINDERS_FILE_PATH = path.join(process.cwd(), "data", "reminders.json");

// 파일이 없으면 생성
function ensureRemindersFile() {
  const dir = path.dirname(REMINDERS_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(REMINDERS_FILE_PATH)) {
    fs.writeFileSync(REMINDERS_FILE_PATH, JSON.stringify([], null, 2), "utf-8");
  }
}

// 리마인더 읽기
function loadReminders(): Reminder[] {
  try {
    ensureRemindersFile();
    const content = fs.readFileSync(REMINDERS_FILE_PATH, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("리마인더 파일 읽기 오류:", error);
    return [];
  }
}

// 리마인더 저장
function saveReminders(reminders: Reminder[]): void {
  try {
    ensureRemindersFile();
    fs.writeFileSync(REMINDERS_FILE_PATH, JSON.stringify(reminders, null, 2), "utf-8");
  } catch (error) {
    console.error("리마인더 파일 저장 오류:", error);
  }
}

// 리마인더 추가
export function addReminder(reminder: Omit<Reminder, "id" | "status" | "createdAt" | "updatedAt">): Reminder {
  const reminders = loadReminders();
  const newReminder: Reminder = {
    ...reminder,
    id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  reminders.push(newReminder);
  saveReminders(reminders);
  return newReminder;
}

// 모든 리마인더 조회
export function getAllReminders(): Reminder[] {
  return loadReminders();
}

// ID로 리마인더 조회
export function getReminderById(id: string): Reminder | undefined {
  const reminders = loadReminders();
  return reminders.find((r) => r.id === id);
}

// 리마인더 업데이트
export function updateReminder(id: string, updates: Partial<Reminder>): Reminder | null {
  const reminders = loadReminders();
  const index = reminders.findIndex((r) => r.id === id);
  if (index === -1) return null;

  reminders[index] = {
    ...reminders[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveReminders(reminders);
  return reminders[index];
}

// 리마인더 삭제
export function deleteReminder(id: string): boolean {
  const reminders = loadReminders();
  const filtered = reminders.filter((r) => r.id !== id);
  if (filtered.length === reminders.length) return false; // 삭제할 항목이 없음

  saveReminders(filtered);
  return true;
}

// 전송 대기 중인 리마인더 조회 (스케줄러용)
export function getPendingReminders(): Reminder[] {
  const now = new Date();
  const reminders = loadReminders();
  
  return reminders.filter((reminder) => {
    if (reminder.status === "failed") return false; // 실패한 것은 제외
    
    const scheduledAt = new Date(reminder.scheduledAt);
    
    // 반복 없는 경우: 예정 시간이 지났고 아직 전송 안 됨
    if (reminder.repeat === "none") {
      return scheduledAt <= now && reminder.status === "pending";
    }
    
    // 반복 있는 경우: 예정 시간이 지났고, 마지막 전송 시간이 없거나 반복 주기가 지났음
    if (reminder.repeat === "daily") {
      const lastSent = reminder.lastSentAt ? new Date(reminder.lastSentAt) : null;
      if (!lastSent) return scheduledAt <= now;
      const daysSinceLastSent = Math.floor((now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceLastSent >= 1;
    }
    
    if (reminder.repeat === "weekly") {
      const lastSent = reminder.lastSentAt ? new Date(reminder.lastSentAt) : null;
      if (!lastSent) return scheduledAt <= now;
      const daysSinceLastSent = Math.floor((now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceLastSent >= 7;
    }
    
    if (reminder.repeat === "monthly") {
      const lastSent = reminder.lastSentAt ? new Date(reminder.lastSentAt) : null;
      if (!lastSent) return scheduledAt <= now;
      const lastSentMonth = lastSent.getMonth();
      const lastSentYear = lastSent.getFullYear();
      const nowMonth = now.getMonth();
      const nowYear = now.getFullYear();
      return (nowYear > lastSentYear) || (nowYear === lastSentYear && nowMonth > lastSentMonth);
    }
    
    return false;
  });
}

// 리마인더 전송 완료 처리
export function markReminderSent(id: string, success: boolean): void {
  updateReminder(id, {
    status: success ? "sent" : "failed",
    lastSentAt: new Date().toISOString(),
  });
  
  // 반복 알림인 경우 다음 전송을 위해 상태를 pending으로 변경
  const reminder = getReminderById(id);
  if (reminder && reminder.repeat !== "none" && success) {
    // 다음 전송 시간 계산
    let nextScheduledAt = new Date(reminder.scheduledAt);
    if (reminder.repeat === "daily") {
      nextScheduledAt.setDate(nextScheduledAt.getDate() + 1);
    } else if (reminder.repeat === "weekly") {
      nextScheduledAt.setDate(nextScheduledAt.getDate() + 7);
    } else if (reminder.repeat === "monthly") {
      nextScheduledAt.setMonth(nextScheduledAt.getMonth() + 1);
    }
    
    updateReminder(id, {
      status: "pending",
      scheduledAt: nextScheduledAt.toISOString(),
    });
  }
}

