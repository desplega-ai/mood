import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { token },
      include: {
        founders: {
          include: {
            moodEntries: {
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    if (!apiKey) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "all";
    const founderId = searchParams.get("founderId");

    const where: any = {
      founder: {
        apiKeyId: apiKey.id,
      },
    };

    // Apply date filtering if period is specified
    if (period !== "all") {
      let startDate: Date;
      let endDate: Date;
      const now = new Date();

      switch (period) {
        case "daily":
          startDate = startOfDay(now);
          endDate = endOfDay(now);
          break;
        case "weekly":
          startDate = startOfWeek(now);
          endDate = endOfWeek(now);
          break;
        case "monthly":
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        default:
          startDate = startOfDay(now);
          endDate = endOfDay(now);
      }

      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (founderId) {
      where.founderId = founderId;
    }

    const moodEntries = await prisma.moodEntry.findMany({
      where,
      include: {
        founder: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ moodEntries, period });
  } catch (error) {
    console.error("Get mood entries error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
