import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get all founders for an API key
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
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!apiKey) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json({ founders: apiKey.founders });
  } catch (error) {
    console.error("Get founders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Create a new founder
export async function POST(request: NextRequest) {
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

    const { name, email } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingFounder = await prisma.founder.findUnique({
      where: { email },
    });

    if (existingFounder) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    const founder = await prisma.founder.create({
      data: {
        name,
        email,
        apiKeyId: apiKey.id,
      },
    });

    return NextResponse.json({ founder }, { status: 201 });
  } catch (error) {
    console.error("Create founder error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
