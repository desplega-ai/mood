import Imap from "imap";
import { simpleParser } from "mailparser";
import { prisma } from "@/lib/prisma";
import { categorizeMood } from "@/lib/ai";

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
      // Use All Mail to catch archived emails
      imap.openBox("[Gmail]/All Mail", false, cb);
    }

    imap.once("ready", () => {
      openInbox((err, box) => {
        if (err) {
          reject(err);
          return;
        }

        // Search for unread emails with MoodCheck in subject
        imap.search(
          [
            "UNSEEN",
            ["HEADER", "SUBJECT", "MoodCheck"],
          ],
          (err, results) => {
            if (err) {
              imap.end();
              reject(err);
              return;
            }

            if (!results || results.length === 0) {
              console.log("No unread emails found");
              imap.end();
              resolve([]);
              return;
            }

            const fetch = imap.fetch(results, { bodies: "", markSeen: true });
            const processedEmails: any[] = [];

            fetch.on("message", (msg) => {
              msg.on("body", (stream) => {
                simpleParser(stream, async (err, parsed) => {
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

                    console.log(`Processing email from: ${fromEmail}`);

                    // Find the founder
                    const founder = await prisma.founder.findUnique({
                      where: { email: fromEmail },
                    });

                    if (!founder) {
                      console.log(`Unknown sender: ${fromEmail}`);
                      return;
                    }

                    // Get the most recent unresponded mood entry
                    const moodEntry = await prisma.moodEntry.findFirst({
                      where: {
                        founderId: founder.id,
                        respondedAt: null,
                      },
                      orderBy: {
                        emailSentAt: "desc",
                      },
                    });

                    if (!moodEntry) {
                      console.log(`No pending mood entry for ${fromEmail}`);
                      return;
                    }

                    // Get email content
                    const emailText = parsed.text || parsed.html || "";

                    // Categorize mood
                    const moodScore = await categorizeMood(emailText);

                    // Update mood entry
                    await prisma.moodEntry.update({
                      where: { id: moodEntry.id },
                      data: {
                        mood: moodScore,
                        rawResponse: emailText,
                        respondedAt: new Date(),
                      },
                    });

                    console.log(`✅ Updated mood for ${founder.name}: ${moodScore}`);
                    processedEmails.push({
                      founder: founder.name,
                      email: fromEmail,
                      mood: moodScore,
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
