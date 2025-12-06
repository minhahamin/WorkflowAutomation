import { NextRequest, NextResponse } from "next/server";
import { getTaskExecutions } from "@/lib/tasks-store";

// GET: 작업 실행 히스토리 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const taskId = searchParams.get("taskId");
    const limit = parseInt(searchParams.get("limit") || "50");

    const executions = getTaskExecutions(taskId || undefined, limit);

    return NextResponse.json({ executions });
  } catch (error: any) {
    console.error("실행 히스토리 조회 오류:", error);
    return NextResponse.json(
      { error: error.message || "실행 히스토리 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

