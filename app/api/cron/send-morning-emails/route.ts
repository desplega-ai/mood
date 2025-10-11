import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMoodCheckEmail } from "@/lib/gmail";
import { generateMotivationalQuote } from "@/lib/ai";

function isWeekday(date: Date): boolean {
  const day = date.getDay();
  // 1-5 are Monday-Friday (0 = Sunday, 6 = Saturday)
  return day >= 1 && day <= 5;
}

function shouldSendEmail(recurrence: string, lastSentDate?: Date): boolean {
  const now = new Date();

  // Never send on weekends
  if (!isWeekday(now)) {
    return false;
  }

  if (recurrence === "daily") {
    return true; // Send every weekday
  }

  if (recurrence === "weekly") {
    // Send on Mondays
    return now.getDay() === 1;
  }

  if (recurrence === "monthly") {
    // Send on the 1st of the month (if it's a weekday)
    return now.getDate() === 1;
  }

  return true; // Default to sending (on weekdays)
}

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all API keys with their founders
    const apiKeys = await prisma.apiKey.findMany({
      include: {
        founders: true,
      },
    });

    const results = [];

    for (const apiKey of apiKeys) {
      // Check if we should send based on recurrence
      if (!shouldSendEmail(apiKey.recurrence)) {
        console.log(`Skipping ${apiKey.companyName} - recurrence: ${apiKey.recurrence}`);
        continue;
      }

      for (const founder of apiKey.founders) {
        try {
          // Create a mood entry first to get the ID
          const moodEntry = await prisma.moodEntry.create({
            data: {
              founderId: founder.id,
              emailSentAt: new Date(),
            },
          });

          // Generate motivational quote
          const quote = await generateMotivationalQuote();

          // Send email with entry ID in subject and motivational quote
          await sendMoodCheckEmail(founder.email, founder.name, moodEntry.id, quote);

          results.push({
            email: founder.email,
            status: "sent",
          });
        } catch (error) {
          console.error(`Failed to send email to ${founder.email}:`, error);
          results.push({
            email: founder.email,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent: results.filter((r) => r.status === "sent").length,
      failed: results.filter((r) => r.status === "failed").length,
      results,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
