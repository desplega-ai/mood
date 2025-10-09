import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { token },
      include: {
        founders: true,
      },
    });

    if (!apiKey) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json({
      valid: true,
      apiKey: {
        id: apiKey.id,
        companyName: apiKey.companyName,
        foundersCount: apiKey.founders.length,
      },
    });
  } catch (error) {
    console.error("Validation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
