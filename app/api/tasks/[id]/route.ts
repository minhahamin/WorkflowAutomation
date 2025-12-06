import { NextRequest, NextResponse } from "next/server";
import {
  getTaskById,
  updateTask,
  deleteTask,
  getTaskExecutions,
} from "@/lib/tasks-store";
import { refreshTaskSchedule } from "@/lib/task-scheduler";
import { z } from "zod";

// 작업 업데이트 스키마
const updateTaskSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(["email", "webhook", "report", "custom"]).optional(),
  cron: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
  config: z.record(z.any()).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET: 특정 작업 조회
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const includeExecutions = searchParams.get("executions") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    const task = getTaskById(id);
    if (!task) {
      return NextResponse.json({ error: "작업을 찾을 수 없습니다." }, { status: 404 });
    }

    const result: any = { task };

    if (includeExecutions) {
      result.executions = getTaskExecutions(id, limit);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("작업 조회 오류:", error);
    return NextResponse.json(
      { error: error.message || "작업 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// PATCH: 작업 업데이트
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const validated = updateTaskSchema.parse(body);

    const task = getTaskById(id);
    if (!task) {
      return NextResponse.json({ error: "작업을 찾을 수 없습니다." }, { status: 404 });
    }

    const updated = updateTask(id, validated);
    if (!updated) {
      return NextResponse.json({ error: "작업 업데이트에 실패했습니다." }, { status: 500 });
    }

    // 스케줄 새로고침
    refreshTaskSchedule(id);

    return NextResponse.json({ task: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "입력 데이터가 올바르지 않습니다.", details: error.errors },
        { status: 400 }
      );
    }

    console.error("작업 업데이트 오류:", error);
    return NextResponse.json(
      { error: error.message || "작업 업데이트에 실패했습니다." },
      { status: 500 }
    );
  }
}

// DELETE: 작업 삭제
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const task = getTaskById(id);
    if (!task) {
      return NextResponse.json({ error: "작업을 찾을 수 없습니다." }, { status: 404 });
    }

    const deleted = deleteTask(id);
    if (!deleted) {
      return NextResponse.json({ error: "작업 삭제에 실패했습니다." }, { status: 500 });
    }

    // 스케줄 새로고침
    refreshTaskSchedule(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("작업 삭제 오류:", error);
    return NextResponse.json(
      { error: error.message || "작업 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}

