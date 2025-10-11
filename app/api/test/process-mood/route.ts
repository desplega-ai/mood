import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { categorizeDualMood } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const { email, moodText } = await request.json();

    if (!email || !moodText) {
      return NextResponse.json({ error: "email and moodText are required" }, { status: 400 });
    }

    // Find the founder
    const founder = await prisma.founder.findUnique({
      where: { email },
    });

    if (!founder) {
      return NextResponse.json({ error: "Founder not found" }, { status: 404 });
    }

    // Get the most recent unresponded mood entry
    const moodEntry = await prisma.moodEntry.findFirst({
      where: {
        founderId: founder.id,
        respondedAt: null,
      },
      orderBy: {
        emailSentAt: "desc",
      },
    });

    if (!moodEntry) {
      return NextResponse.json({ error: "No pending mood entry found" }, { status: 404 });
    }

    // Categorize both moods (yesterday and today)
    const moods = await categorizeDualMood(moodText);

    // Update mood entry
    const updated = await prisma.moodEntry.update({
      where: { id: moodEntry.id },
      data: {
        moodYesterday: moods.yesterday,
        moodToday: moods.today,
        rawResponse: moodText,
        respondedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      founder: founder.name,
      moodYesterday: moods.yesterday,
      moodToday: moods.today,
      moodLabelYesterday: getMoodLabel(moods.yesterday),
      moodLabelToday: getMoodLabel(moods.today),
      rawResponse: moodText,
      updated,
    });
  } catch (error) {
    console.error("Error processing mood:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}

function getMoodLabel(score: number): string {
  const labels: Record<number, string> = {
    0: "Terrible",
    1: "Bad",
    2: "Meh",
    3: "Okay",
    4: "Good",
    5: "Excellent",
  };
  return labels[score] || "Unknown";
}
