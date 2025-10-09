import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Delete a founder
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Verify the founder belongs to this API key
    const founder = await prisma.founder.findFirst({
      where: {
        id,
        apiKeyId: apiKey.id,
      },
    });

    if (!founder) {
      return NextResponse.json({ error: "Founder not found" }, { status: 404 });
    }

    await prisma.founder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete founder error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Update a founder
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Verify the founder belongs to this API key
    const founder = await prisma.founder.findFirst({
      where: {
        id,
        apiKeyId: apiKey.id,
      },
    });

    if (!founder) {
      return NextResponse.json({ error: "Founder not found" }, { status: 404 });
    }

    const updatedFounder = await prisma.founder.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
    });

    return NextResponse.json({ founder: updatedFounder });
  } catch (error) {
    console.error("Update founder error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
