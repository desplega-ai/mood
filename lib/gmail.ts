import nodemailer from "nodemailer";

if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD must be set");
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendMoodCheckEmail(
  to: string,
  founderName: string,
  entryId: string,
  motivationalQuote?: string
) {
  const subject = `[MoodCheck-${entryId}] How are you doing?`;

  const dashboardUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3002";

  const greeting = `Hi ${founderName},

Two quick questions:

1. How was yesterday?
2. How do you feel about today?`;

  const quoteSection = motivationalQuote ? `\n\n${motivationalQuote}\n` : "\n";

  const message = `${greeting}${quoteSection}\nJust reply to this email with your thoughts.

View your mood dashboard: ${dashboardUrl}`;

  try {
    const info = await transporter.sendMail({
      from: `"Mood Tracker" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text: message,
    });

    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Failed to send mood check email:", error);
    throw error;
  }
}
