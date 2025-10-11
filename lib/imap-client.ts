import Imap from "imap";
import { simpleParser } from "mailparser";
import { prisma } from "@/lib/prisma";
import { categorizeDualMood } from "@/lib/ai";

export async function processEmailReplies() {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: process.env.GMAIL_USER!,
      password: process.env.GMAIL_APP_PASSWORD!,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    const results: any[] = [];

    function openInbox(cb: (err: Error | null, box?: any) => void) {
      // Use INBOX - works across all Gmail locales
      imap.openBox("INBOX", false, cb);
    }

    imap.once("ready", () => {
      openInbox((err, box) => {
        if (err) {
          reject(err);
          return;
        }

        // Search for emails from the last 24 hours with MoodCheck in subject
        // We'll check the database to see if they've been processed
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        imap.search(
          [
            ["SINCE", yesterday],
            ["HEADER", "SUBJECT", "MoodCheck"],
          ],
          (err, results) => {
            if (err) {
              imap.end();
              reject(err);
              return;
            }

            if (!results || results.length === 0) {
              console.log("No MoodCheck emails found");
              imap.end();
              resolve([]);
              return;
            }

            console.log(`Found ${results.length} MoodCheck emails`);
            const fetch = imap.fetch(results, { bodies: "", markSeen: false });
            const processedEmails: any[] = [];

            fetch.on("message", (msg) => {
              msg.on("body", (stream) => {
                simpleParser(stream as any, async (err, parsed) => {
                  if (err) {
                    console.error("Error parsing email:", err);
                    return;
                  }

                  try {
                    const fromEmail = parsed.from?.value[0]?.address;
                    if (!fromEmail) {
                      console.log("No from email found");
                      return;
                    }

                    // Extract entry ID from subject: [MoodCheck-{entryId}] ...
                    const subject = parsed.subject || "";
                    const entryIdMatch = subject.match(/\[MoodCheck-([^\]]+)\]/);

                    if (!entryIdMatch) {
                      console.log(`No entry ID found in subject: ${subject}`);
                      return;
                    }

                    const entryId = entryIdMatch[1];
                    console.log(`Processing email from: ${fromEmail} for entry: ${entryId}`);

                    // Find the specific mood entry by ID
                    const moodEntry = await prisma.moodEntry.findFirst({
                      where: {
                        id: entryId,
                        respondedAt: null, // Only process if not already responded
                      },
                      include: {
                        founder: true,
                      },
                    });

                    if (!moodEntry) {
                      console.log(`Mood entry ${entryId} not found or already processed`);
                      return;
                    }

                    // Verify the email is from the correct founder
                    if (moodEntry.founder.email !== fromEmail) {
                      console.log(
                        `Email from ${fromEmail} doesn't match entry founder ${moodEntry.founder.email}`
                      );
                      return;
                    }

                    // Get email content
                    const emailText = parsed.text || parsed.html || "";

                    // Categorize both moods (yesterday and today)
                    const moods = await categorizeDualMood(emailText);

                    // Update mood entry
                    await prisma.moodEntry.update({
                      where: { id: moodEntry.id },
                      data: {
                        moodYesterday: moods.yesterday,
                        moodToday: moods.today,
                        rawResponse: emailText,
                        respondedAt: new Date(),
                      },
                    });

                    console.log(
                      `✅ Updated mood for ${moodEntry.founder.name}: Yesterday=${moods.yesterday}, Today=${moods.today}`
                    );
                    processedEmails.push({
                      founder: moodEntry.founder.name,
                      email: fromEmail,
                      moodYesterday: moods.yesterday,
                      moodToday: moods.today,
                    });
                  } catch (error) {
                    console.error("Error processing email:", error);
                  }
                });
              });
            });

            fetch.once("error", (err) => {
              console.error("Fetch error:", err);
              imap.end();
              reject(err);
            });

            fetch.once("end", () => {
              console.log("Done fetching messages");
              imap.end();
              setTimeout(() => resolve(processedEmails), 1000);
            });
          }
        );
      });
    });

    imap.once("error", (err: Error) => {
      console.error("IMAP error:", err);
      reject(err);
    });

    imap.once("end", () => {
      console.log("Connection ended");
    });

    imap.connect();
  });
}
