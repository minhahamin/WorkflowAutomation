// 리마인더 스케줄러 (node-cron 사용)
import cron from "node-cron";
import { getPendingReminders, markReminderSent } from "./reminders-store";

// 알림 전송 함수 (직접 API 호출 대신 직접 전송)
async function sendReminder(reminder: any) {
  try {
    // Slack/Email 직접 전송
    const { IncomingWebhook } = require("@slack/webhook");
    const nodemailer = require("nodemailer");
    const results: any = {};

    // Slack 알림 전송
    if ((reminder.channel === "slack" || reminder.channel === "both") && reminder.slackWebhook) {
      try {
        const webhook = new IncomingWebhook(reminder.slackWebhook);
        await webhook.send({
          text: reminder.title,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*${reminder.title}*\n\n${reminder.message}\n\n일시: ${new Date(reminder.scheduledAt).toLocaleString("ko-KR")}`,
              },
            },
          ],
        });
        results.slack = { success: true };
      } catch (error) {
        results.slack = { success: false, error: error instanceof Error ? error.message : "Slack 전송 실패" };
      }
    }

    // Email 알림 전송
    if ((reminder.channel === "email" || reminder.channel === "both") && reminder.email) {
      try {
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
            to: reminder.email,
            subject: reminder.title,
            text: `${reminder.message}\n\n일시: ${new Date(reminder.scheduledAt).toLocaleString("ko-KR")}`,
            html: `
              <h2>${reminder.title}</h2>
              <p>${reminder.message}</p>
              <p><small>일시: ${new Date(reminder.scheduledAt).toLocaleString("ko-KR")}</small></p>
            `,
          });
          results.email = { success: true };
        } else {
          results.email = { success: false, error: "SMTP 설정이 필요합니다." };
        }
      } catch (error) {
        results.email = { success: false, error: error instanceof Error ? error.message : "Email 전송 실패" };
      }
    }

    const success = Object.values(results).some((r: any) => r.success);

    // 전송 결과 저장
    markReminderSent(reminder.id, success);

    if (success) {
      console.log(`✅ 리마인더 전송 성공: ${reminder.title} (ID: ${reminder.id})`);
    } else {
      console.error(`❌ 리마인더 전송 실패: ${reminder.title} (ID: ${reminder.id})`, results);
    }
  } catch (error) {
    console.error(`❌ 리마인더 전송 오류: ${reminder.title} (ID: ${reminder.id})`, error);
    markReminderSent(reminder.id, false);
  }
}

// 스케줄러 시작
export function startReminderScheduler() {
  console.log("🕐 리마인더 스케줄러 시작...");

  // 매 분마다 실행 (전송 대기 중인 리마인더 확인)
  cron.schedule("* * * * *", async () => {
    try {
      const pendingReminders = getPendingReminders();
      
      if (pendingReminders.length > 0) {
        console.log(`📬 ${pendingReminders.length}개의 전송 대기 중인 리마인더 발견`);
        
        // 모든 대기 중인 리마인더 전송
        await Promise.all(pendingReminders.map((reminder) => sendReminder(reminder)));
      }
    } catch (error) {
      console.error("스케줄러 실행 오류:", error);
    }
  });

  console.log("✅ 리마인더 스케줄러가 실행 중입니다. (매 분마다 확인)");
}

