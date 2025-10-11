import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { token },
    });

    if (!apiKey) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { recurrence } = await request.json();

    if (!["daily", "weekly", "monthly"].includes(recurrence)) {
      return NextResponse.json({ error: "Invalid recurrence value" }, { status: 400 });
    }

    const updatedApiKey = await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { recurrence },
    });

    return NextResponse.json({ apiKey: updatedApiKey });
  } catch (error) {
    console.error("Update recurrence error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { token },
      select: {
        recurrence: true,
      },
    });

    if (!apiKey) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json({ recurrence: apiKey.recurrence });
  } catch (error) {
    console.error("Get recurrence error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
