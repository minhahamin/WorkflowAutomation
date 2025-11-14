import { NextRequest, NextResponse } from "next/server";
import { IncomingWebhook } from "@slack/webhook";
import nodemailer from "nodemailer";

// 알림 전송 API (Slack + Email)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channel, title, message, slackWebhook, email, scheduledAt } = body;

    const results: any = {};

    // Slack 알림 전송
    if ((channel === "slack" || channel === "both") && slackWebhook) {
      try {
        const webhook = new IncomingWebhook(slackWebhook);
        await webhook.send({
          text: title,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*${title}*\n\n${message}\n\n일시: ${new Date(scheduledAt).toLocaleString("ko-KR")}`,
              },
            },
          ],
        });
        results.slack = { success: true, message: "Slack 알림 전송 완료" };
      } catch (error) {
        results.slack = { success: false, error: error instanceof Error ? error.message : "Slack 전송 실패" };
      }
    }

    // Email 알림 전송
    if ((channel === "email" || channel === "both") && email) {
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

        if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
          results.email = { success: false, error: "SMTP 설정이 필요합니다." };
        } else {
          const transporter = nodemailer.createTransport(smtpConfig);

          await transporter.sendMail({
            from: smtpConfig.auth.user,
            to: email,
            subject: title,
            text: `${message}\n\n일시: ${new Date(scheduledAt).toLocaleString("ko-KR")}`,
            html: `
              <h2>${title}</h2>
              <p>${message}</p>
              <p><small>일시: ${new Date(scheduledAt).toLocaleString("ko-KR")}</small></p>
            `,
          });

          results.email = { success: true, message: "Email 알림 전송 완료" };
        }
      } catch (error) {
        results.email = { success: false, error: error instanceof Error ? error.message : "Email 전송 실패" };
      }
    }

    return NextResponse.json({
      success: Object.values(results).some((r: any) => r.success),
      results,
    });
  } catch (error) {
    console.error("알림 전송 오류:", error);
    return NextResponse.json(
      { error: "알림 전송 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

