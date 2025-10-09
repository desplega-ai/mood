import { NextRequest, NextResponse } from "next/server";
import Imap from "imap";
import { simpleParser } from "mailparser";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return new Promise<NextResponse>((resolve) => {
    const imap = new Imap({
      user: process.env.GMAIL_USER!,
      password: process.env.GMAIL_APP_PASSWORD!,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    function openInbox(cb: (err: Error | null, box?: any) => void) {
      imap.openBox("INBOX", false, cb);
    }

    imap.once("ready", () => {
      openInbox((err, box) => {
        if (err) {
          resolve(NextResponse.json({ error: err.message }, { status: 500 }));
          return;
        }

        console.log("Box info:", box);

        // Search for ALL UNSEEN emails (no TO filter)
        imap.search(["UNSEEN"], (err, results) => {
          if (err) {
            imap.end();
            resolve(NextResponse.json({ error: err.message }, { status: 500 }));
            return;
          }

          console.log(`Found ${results?.length || 0} unseen emails`);

          if (!results || results.length === 0) {
            imap.end();
            resolve(NextResponse.json({
              message: "No unread emails found",
              total: box.messages.total,
              unseen: box.messages.unseen
            }));
            return;
          }

          const fetch = imap.fetch(results, { bodies: "HEADER.FIELDS (FROM TO SUBJECT DATE)" });
          const emails: any[] = [];

          fetch.on("message", (msg, seqno) => {
            msg.on("body", (stream) => {
              simpleParser(stream as any, async (err, parsed) => {
                if (err) {
                  console.error("Error parsing email:", err);
                  return;
                }

                emails.push({
                  seqno,
                  from: parsed.from?.text,
                  to: Array.isArray(parsed.to) ? parsed.to[0]?.text : parsed.to?.text,
                  subject: parsed.subject,
                  date: parsed.date,
                });
              });
            });
          });

          fetch.once("error", (err) => {
            console.error("Fetch error:", err);
            imap.end();
            resolve(NextResponse.json({ error: err.message }, { status: 500 }));
          });

          fetch.once("end", () => {
            console.log("Done fetching");
            imap.end();
            setTimeout(() => {
              resolve(NextResponse.json({
                found: emails.length,
                emails,
                boxInfo: {
                  total: box.messages.total,
                  unseen: box.messages.unseen
                }
              }));
            }, 500);
          });
        });
      });
    });

    imap.once("error", (err: Error) => {
      console.error("IMAP error:", err);
      resolve(NextResponse.json({ error: err.message }, { status: 500 }));
    });

    imap.once("end", () => {
      console.log("Connection ended");
    });

    imap.connect();
  });
}
