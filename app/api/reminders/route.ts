import { NextRequest, NextResponse } from "next/server";

// TODO: 데이터베이스에 알림 저장 및 스케줄 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 환경 변수 확인
    const slackWebhook = process.env.SLACK_WEBHOOK_URL;
    const smtpConfig = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    };

    // 알림 채널에 따라 필요한 환경 변수 확인
    if ((body.channel === "slack" || body.channel === "both") && !slackWebhook) {
      return NextResponse.json(
        { error: "SLACK_WEBHOOK_URL 환경 변수가 설정되지 않았습니다." },
        { status: 400 }
      );
    }

    if ((body.channel === "email" || body.channel === "both")) {
      if (!smtpConfig.host || !smtpConfig.user || !smtpConfig.pass) {
        return NextResponse.json(
          { error: "Email SMTP 환경 변수가 설정되지 않았습니다." },
          { status: 400 }
        );
      }
    }

    // TODO: 실제 알림 등록 로직
    // 1. 데이터베이스에 알림 저장
    // 2. BullMQ에 스케줄 작업 추가
    // 3. Slack/Email 전송 준비

    /*
    // Slack 알림 예시
    if (body.channel === "slack" || body.channel === "both") {
      await fetch(slackWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: body.title,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*${body.title}*\n${body.message}`
              }
            }
          ]
        })
      });
    }

    // Email 알림 예시 (nodemailer 사용)
    if (body.channel === "email" || body.channel === "both") {
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.pass,
        }
      });

      await transporter.sendMail({
        from: smtpConfig.user,
        to: body.email,
        subject: body.title,
        text: body.message,
      });
    }
    */

    return NextResponse.json({
      success: true,
      message: "알림이 등록되었습니다.",
      id: Date.now().toString(),
    });
  } catch (error) {
    console.error("알림 등록 오류:", error);
    return NextResponse.json(
      { error: "알림 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // TODO: 데이터베이스에서 알림 목록 조회
    const reminders = [];

    return NextResponse.json(reminders);
  } catch (error) {
    console.error("알림 조회 오류:", error);
    return NextResponse.json(
      { error: "알림 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
