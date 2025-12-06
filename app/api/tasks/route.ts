import { NextRequest, NextResponse } from "next/server";
import {
  addTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskExecutions,
} from "@/lib/tasks-store";
import { refreshTaskSchedule } from "@/lib/task-scheduler";
import { z } from "zod";

// 작업 생성 스키마
const createTaskSchema = z.object({
  name: z.string().min(1, "작업 이름은 필수입니다."),
  description: z.string().optional(),
  type: z.enum(["email", "webhook", "report", "custom"]),
  cron: z.string().min(1, "CRON 표현식은 필수입니다."),
  enabled: z.boolean().default(true),
  config: z.record(z.any()),
});

// GET: 모든 작업 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const taskId = searchParams.get("id");
    const includeExecutions = searchParams.get("executions") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    if (taskId) {
      // 특정 작업 조회
      const task = getTaskById(taskId);
      if (!task) {
        return NextResponse.json({ error: "작업을 찾을 수 없습니다." }, { status: 404 });
      }

      const result: any = { task };

      if (includeExecutions) {
        result.executions = getTaskExecutions(taskId, limit);
      }

      return NextResponse.json(result);
    }

    // 모든 작업 조회
    const tasks = getAllTasks();
    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("작업 조회 오류:", error);
    return NextResponse.json(
      { error: error.message || "작업 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// POST: 새 작업 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createTaskSchema.parse(body);

    const task = addTask({
      name: validated.name,
      description: validated.description,
      type: validated.type,
      cron: validated.cron,
      enabled: validated.enabled,
      config: validated.config,
    });

    // 스케줄 새로고침
    if (task.enabled) {
      refreshTaskSchedule(task.id);
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "입력 데이터가 올바르지 않습니다.", details: error.errors },
        { status: 400 }
      );
    }

    console.error("작업 생성 오류:", error);
    return NextResponse.json(
      { error: error.message || "작업 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}

