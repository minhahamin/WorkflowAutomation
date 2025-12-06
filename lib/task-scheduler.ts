// 작업 스케줄러 (node-cron 사용)
import cron from "node-cron";
import { getActiveTasks, getTaskById, addExecution } from "./tasks-store";
import type { Task, TaskType } from "./tasks-store";
import axios from "axios";

// 작업 실행 함수 (export하여 API에서 직접 호출 가능)
export async function executeTask(task: Task): Promise<{ success: boolean; error?: string; result?: any }> {
  const startTime = Date.now();
  let result: any = null;
  let error: string | undefined = undefined;

  try {
    console.log(`🔄 작업 실행 시작: ${task.name} (ID: ${task.id}, 타입: ${task.type})`);

    switch (task.type) {
      case "email":
        result = await executeEmailTask(task);
        break;
      case "webhook":
        result = await executeWebhookTask(task);
        break;
      case "report":
        result = await executeReportTask(task);
        break;
      case "custom":
        result = await executeCustomTask(task);
        break;
      default:
        throw new Error(`알 수 없는 작업 타입: ${task.type}`);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ 작업 실행 완료: ${task.name} (${duration}ms)`);

    // 실행 기록 저장
    addExecution({
      taskId: task.id,
      status: "success",
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      duration,
      result,
    });

    return { success: true, result };
  } catch (err: any) {
    const duration = Date.now() - startTime;
    error = err.message || String(err);
    console.error(`❌ 작업 실행 실패: ${task.name}`, error);

    // 실행 기록 저장
    addExecution({
      taskId: task.id,
      status: "failed",
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      duration,
      error,
    });

    return { success: false, error };
  }
}

// 이메일 작업 실행
async function executeEmailTask(task: Task) {
  const config = task.config as any;
  
  if (!config.to || !config.subject || !config.body) {
    throw new Error("이메일 설정이 올바르지 않습니다.");
  }

  const nodemailer = require("nodemailer");
  const smtpConfig = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
    throw new Error("SMTP 설정이 필요합니다. 환경 변수를 확인하세요.");
  }

  const transporter = nodemailer.createTransport(smtpConfig);
  
  const mailOptions: any = {
    from: smtpConfig.auth.user,
    to: config.to,
    subject: config.subject,
  };

  if (config.isHtml) {
    mailOptions.html = config.body;
  } else {
    mailOptions.text = config.body;
  }

  const info = await transporter.sendMail(mailOptions);
  return { messageId: info.messageId, to: config.to };
}

// 웹훅 작업 실행
async function executeWebhookTask(task: Task) {
  const config = task.config as any;
  
  if (!config.url) {
    throw new Error("웹훅 URL이 필요합니다.");
  }

  const options: any = {
    method: config.method || "POST",
    url: config.url,
    headers: {
      "Content-Type": "application/json",
      ...config.headers,
    },
  };

  if (config.body && (config.method === "POST" || config.method === "PUT")) {
    options.data = config.body;
  }

  const response = await axios(options);
  return { status: response.status, statusText: response.statusText, data: response.data };
}

// 리포트 작업 실행
async function executeReportTask(task: Task) {
  const config = task.config as any;
  
  let reportContent = "";

  switch (config.reportType) {
    case "log-summary":
      // 로그 요약 리포트 생성
      const { getStats } = require("./logs-store");
      const stats = getStats({});
      reportContent = `📊 로그 요약 리포트\n\n`;
      reportContent += `- 총 로그 수: ${stats.totalLogs}\n`;
      reportContent += `- 에러 로그: ${stats.errorLogs}\n`;
      reportContent += `- 경고 로그: ${stats.warningLogs}\n`;
      reportContent += `- 정보 로그: ${stats.infoLogs}\n`;
      reportContent += `\n생성 시간: ${new Date().toLocaleString("ko-KR")}`;
      break;

    case "document-summary":
      // 문서 요약 리포트
      const { getAllDocumentHistory } = require("./documents-store");
      const history = getAllDocumentHistory();
      reportContent = `📄 문서 생성 요약\n\n`;
      reportContent += `- 총 생성 문서: ${history.length}개\n`;
      const recent = history.slice(-10);
      reportContent += `\n최근 문서:\n`;
      recent.forEach((doc: any, idx: number) => {
        reportContent += `${idx + 1}. ${doc.templateName} - ${new Date(doc.createdAt).toLocaleString("ko-KR")}\n`;
      });
      break;

    case "system-status":
      // 시스템 상태 리포트
      reportContent = `🖥️ 시스템 상태 리포트\n\n`;
      reportContent += `- 서버 시간: ${new Date().toLocaleString("ko-KR")}\n`;
      reportContent += `- Node.js 버전: ${process.version}\n`;
      reportContent += `- 메모리 사용량: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB\n`;
      break;

    default:
      throw new Error(`알 수 없는 리포트 타입: ${config.reportType}`);
  }

  const results: any = {};

  // 이메일 전송
  if (config.emailTo) {
    try {
      const nodemailer = require("nodemailer");
      const smtpConfig = {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      };

      if (smtpConfig.auth.user && smtpConfig.auth.pass) {
        const transporter = nodemailer.createTransport(smtpConfig);
        await transporter.sendMail({
          from: smtpConfig.auth.user,
          to: config.emailTo,
          subject: `[자동 리포트] ${config.reportType}`,
          text: reportContent,
        });
        results.email = { success: true };
      }
    } catch (error: any) {
      results.email = { success: false, error: error.message };
    }
  }

  // Slack 전송
  if (config.slackWebhook) {
    try {
      const { IncomingWebhook } = require("@slack/webhook");
      const webhook = new IncomingWebhook(config.slackWebhook);
      await webhook.send({
        text: `[자동 리포트] ${config.reportType}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `\`\`\`${reportContent}\`\`\``,
            },
          },
        ],
      });
      results.slack = { success: true };
    } catch (error: any) {
      results.slack = { success: false, error: error.message };
    }
  }

  return { reportContent, results };
}

// 커스텀 작업 실행
async function executeCustomTask(task: Task) {
  const config = task.config as any;
  
  // 커스텀 스크립트 실행은 안전상 제한적으로 구현
  // 실제로는 sandbox 환경에서 실행해야 함
  if (!config.script) {
    throw new Error("커스텀 스크립트가 필요합니다.");
  }

  // 간단한 예시: API 호출만 허용
  // 실제 운영에서는 더 안전한 방식으로 구현 필요
  console.warn("⚠️ 커스텀 작업 실행은 제한적입니다. 안전을 위해 API 호출만 허용됩니다.");
  
  // 여기서는 웹훅과 유사하게 처리
  return { message: "커스텀 작업 실행됨 (제한적 구현)", config };
}

// 스케줄러 시작
let scheduledTasks: Map<string, cron.ScheduledTask> = new Map();

export function startTaskScheduler() {
  console.log("⏰ 작업 스케줄러 시작...");

  // 모든 활성 작업 로드 및 스케줄 등록
  function scheduleAllTasks() {
    // 기존 스케줄 취소
    scheduledTasks.forEach((scheduledTask) => scheduledTask.stop());
    scheduledTasks.clear();

    const activeTasks = getActiveTasks();
    console.log(`📋 활성 작업 ${activeTasks.length}개 발견`);

    activeTasks.forEach((task) => {
      try {
        // CRON 표현식 검증
        if (!cron.validate(task.cron)) {
          console.error(`❌ 잘못된 CRON 표현식: ${task.cron} (작업: ${task.name})`);
          return;
        }

        const scheduledTask = cron.schedule(task.cron, async () => {
          const currentTask = getTaskById(task.id);
          if (currentTask && currentTask.enabled && currentTask.status === "active") {
            await executeTask(currentTask);
          }
        });

        scheduledTasks.set(task.id, scheduledTask);
        console.log(`✅ 작업 스케줄 등록: ${task.name} (CRON: ${task.cron})`);
      } catch (error) {
        console.error(`❌ 작업 스케줄 등록 실패: ${task.name}`, error);
      }
    });
  }

  // 초기 스케줄링
  scheduleAllTasks();

  // 1분마다 활성 작업 다시 로드 (동적으로 추가/수정된 작업 반영)
  cron.schedule("* * * * *", () => {
    scheduleAllTasks();
  });

  console.log("✅ 작업 스케줄러가 실행 중입니다.");
}

// 특정 작업 스케줄 새로고침 (작업 추가/수정 시 호출)
export function refreshTaskSchedule(taskId?: string) {
  if (taskId) {
    const task = getTaskById(taskId);
    if (task) {
      // 해당 작업만 다시 스케줄링
      const existing = scheduledTasks.get(taskId);
      if (existing) {
        existing.stop();
        scheduledTasks.delete(taskId);
      }

      if (task.enabled && task.status === "active" && cron.validate(task.cron)) {
        const scheduledTask = cron.schedule(task.cron, async () => {
          const currentTask = getTaskById(taskId);
          if (currentTask && currentTask.enabled && currentTask.status === "active") {
            await executeTask(currentTask);
          }
        });
        scheduledTasks.set(taskId, scheduledTask);
      }
    }
  } else {
    // 모든 작업 다시 스케줄링
    startTaskScheduler();
  }
}

