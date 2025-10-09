import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import crypto from "crypto";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { name, email, companyName } = await request.json();

    if (!name || !email || !companyName) {
      return NextResponse.json(
        { error: "Name, email, and company name are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Generate a unique API token
    const token = `mood-${crypto.randomBytes(16).toString("hex")}`;

    // Create API key and founder in database
    const apiKey = await prisma.apiKey.create({
      data: {
        token,
        companyName,
        founders: {
          create: {
            name,
            email,
          },
        },
      },
    });

    // Send email with API key
    const dashboardUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3002";

    await transporter.sendMail({
      from: `"Mood Tracker" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Welcome to Mood Tracker - Your API Key",
      text: `Hi ${name}!

Welcome to Mood Tracker for ${companyName}! 🎉

Your API key has been created. Use this key to access your mood tracking dashboard:

API Key: ${token}

Access your dashboard here: ${dashboardUrl}

Next steps:
1. Visit ${dashboardUrl}
2. Enter your API key
3. Configure founders who will receive daily mood check emails
4. Start tracking mood trends!

If you have any questions, feel free to reply to this email.

Best regards,
The Mood Tracker Team`,
    });

    return NextResponse.json({
      success: true,
      message: "API key created and sent to your email!",
    });
  } catch (error) {
    console.error("Error creating API key:", error);
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 });
  }
}
