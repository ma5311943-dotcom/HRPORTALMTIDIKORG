import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ApiError,
  apiErrorResponse,
  assertSameOrigin,
  requirePermission,
} from "@/lib/server-auth";

const VALID_PRIORITIES = ["Urgent", "Official Notice", "Routine", "Inquiry"] as const;

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission(req, "canSendMessage");
    const { searchParams } = new URL(req.url);
    const requestedDistrict = searchParams.get("district") || undefined;
    const district =
      session.district && session.district !== "All"
        ? session.district
        : requestedDistrict;
    const messages = await db.getMessages(district);
    return NextResponse.json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const session = await requirePermission(req, "canSendMessage");
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) throw new ApiError(400, "Invalid request body.");

    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!subject || !message) {
      throw new ApiError(400, "Please enter a subject and message content.");
    }
    if (subject.length > 180 || message.length > 4000) {
      throw new ApiError(400, "Subject or message exceeds the allowed length.");
    }

    const priority =
      typeof body.priority === "string" &&
      VALID_PRIORITIES.includes(body.priority as (typeof VALID_PRIORITIES)[number])
        ? (body.priority as (typeof VALID_PRIORITIES)[number])
        : "Routine";

    const requestedDistrict =
      typeof body.district === "string" ? body.district.trim() : "";
    const district =
      session.district && session.district !== "All"
        ? session.district
        : requestedDistrict || "All";

    const newMessage = await db.createMessage({
      senderId: session.id,
      senderName: session.name,
      senderRole: session.title,
      senderDepartment: session.department,
      district,
      subject,
      message,
      priority,
    });

    return NextResponse.json({ success: true, data: newMessage }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const session = await requirePermission(req, "canSendMessage");
    const body = (await req.json().catch(() => ({}))) as { ids?: unknown };
    const ids = Array.isArray(body.ids)
      ? body.ids.filter((id): id is string => typeof id === "string")
      : undefined;

    const updated = await db.markMessagesRead(ids, session.district);
    return NextResponse.json({ success: true, updated });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
