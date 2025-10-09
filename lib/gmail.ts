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
  timeOfDay: "morning" | "afternoon"
) {
  const subject = timeOfDay === "morning"
    ? "[MoodCheck] How are you feeling this morning?"
    : "[MoodCheck] How was your day?";

  const message = timeOfDay === "morning"
    ? `Hi ${founderName},\n\nHow are you feeling today?\n\nJust reply to this email with how you're doing.`
    : `Hi ${founderName},\n\nHow was your day?\n\nJust reply to this email with how you're doing.`;

  try {
    const info = await transporter.sendMail({
      from: `"Mood Tracker" <t@desplega.ai>`,
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
