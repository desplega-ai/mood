import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMoodCheckEmail } from "@/lib/gmail";

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all founders
    const founders = await prisma.founder.findMany({
      include: {
        apiKey: true,
      },
    });

    const results = [];

    for (const founder of founders) {
      try {
        // Send afternoon email
        await sendMoodCheckEmail(founder.email, founder.name, "afternoon");

        // Create a mood entry to track that email was sent
        await prisma.moodEntry.create({
          data: {
            founderId: founder.id,
            mood: 3, // Default placeholder, will be updated when response is received
            timeOfDay: "afternoon",
            emailSentAt: new Date(),
          },
        });

        results.push({
          email: founder.email,
          status: "sent"
        });
      } catch (error) {
        console.error(`Failed to send email to ${founder.email}:`, error);
        results.push({
          email: founder.email,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    return NextResponse.json({
      success: true,
      sent: results.filter(r => r.status === "sent").length,
      failed: results.filter(r => r.status === "failed").length,
      results,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
