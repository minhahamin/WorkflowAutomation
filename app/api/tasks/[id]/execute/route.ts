import { NextRequest, NextResponse } from "next/server";
import { getTaskById } from "@/lib/tasks-store";
import { executeTask } from "@/lib/task-scheduler";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST: 작업 수동 실행
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const task = getTaskById(id);
    if (!task) {
      return NextResponse.json({ error: "작업을 찾을 수 없습니다." }, { status: 404 });
    }

    const result = await executeTask(task);

    return NextResponse.json({
      success: result.success,
      result: result.result,
      error: result.error,
    });
  } catch (error: any) {
    console.error("작업 실행 오류:", error);
    return NextResponse.json(
      { error: error.message || "작업 실행에 실패했습니다." },
      { status: 500 }
    );
  }
}

