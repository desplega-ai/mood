import { NextRequest, NextResponse } from "next/server";
import { processEmailReplies } from "@/lib/imap-client";

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron or authorized
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Processing email replies...");
    const results = await processEmailReplies();

    return NextResponse.json({
      success: true,
      processed: Array.isArray(results) ? results.length : 0,
      results,
    });
  } catch (error) {
    console.error("Error processing email replies:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
