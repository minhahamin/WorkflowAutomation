import { NextRequest, NextResponse } from "next/server";
import { addReminder, getAllReminders } from "@/lib/reminders-store";

// 리마인더 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, message, scheduledAt, channel, repeat, slackWebhook, email } = body;

    // 필수 필드 검증
    if (!title || !message || !scheduledAt || !channel) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 채널별 필수 필드 검증
    if ((channel === "slack" || channel === "both") && !slackWebhook) {
      return NextResponse.json(
        { error: "Slack Webhook URL이 필요합니다." },
        { status: 400 }
      );
    }

    if ((channel === "email" || channel === "both") && !email) {
      return NextResponse.json(
        { error: "이메일 주소가 필요합니다." },
        { status: 400 }
      );
    }

    // 예정 시간 검증
    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: "올바른 날짜/시간 형식이 아닙니다." },
        { status: 400 }
      );
    }

    // 리마인더 추가
    const reminder = addReminder({
      title,
      message,
      scheduledAt: scheduledDate.toISOString(),
      channel,
      repeat: repeat || "none",
      slackWebhook,
      email,
    });

    return NextResponse.json({
      success: true,
      message: "리마인더가 등록되었습니다.",
      reminder,
    });
  } catch (error) {
    console.error("리마인더 등록 오류:", error);
    return NextResponse.json(
      { error: "리마인더 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 리마인더 목록 조회
export async function GET() {
  try {
    const reminders = getAllReminders();
    
    // 날짜순 정렬 (최신순)
    reminders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(reminders);
  } catch (error) {
    console.error("리마인더 조회 오류:", error);
    return NextResponse.json(
      { error: "리마인더 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
