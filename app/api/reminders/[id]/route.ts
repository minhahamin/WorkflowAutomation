import { NextRequest, NextResponse } from "next/server";
import { getReminderById, updateReminder, deleteReminder } from "@/lib/reminders-store";

// 리마인더 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reminder = getReminderById(params.id);
    
    if (!reminder) {
      return NextResponse.json(
        { error: "리마인더를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(reminder);
  } catch (error) {
    console.error("리마인더 조회 오류:", error);
    return NextResponse.json(
      { error: "리마인더 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 리마인더 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const reminder = getReminderById(params.id);
    
    if (!reminder) {
      return NextResponse.json(
        { error: "리마인더를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const updated = updateReminder(params.id, body);
    
    if (!updated) {
      return NextResponse.json(
        { error: "리마인더 수정 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "리마인더가 수정되었습니다.",
      reminder: updated,
    });
  } catch (error) {
    console.error("리마인더 수정 오류:", error);
    return NextResponse.json(
      { error: "리마인더 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 리마인더 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = deleteReminder(params.id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: "리마인더를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "리마인더가 삭제되었습니다.",
    });
  } catch (error) {
    console.error("리마인더 삭제 오류:", error);
    return NextResponse.json(
      { error: "리마인더 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
