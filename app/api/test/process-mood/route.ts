import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { categorizeMood } from "@/lib/ai";

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

    // Categorize mood
    const moodScore = await categorizeMood(moodText);

    // Update mood entry
    const updated = await prisma.moodEntry.update({
      where: { id: moodEntry.id },
      data: {
        mood: moodScore,
        rawResponse: moodText,
        respondedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      founder: founder.name,
      moodScore,
      moodLabel: getMoodLabel(moodScore),
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
