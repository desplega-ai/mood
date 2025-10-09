import { NextRequest, NextResponse } from "next/server";
import Imap from "imap";

export async function GET(request: NextRequest) {
  return new Promise((resolve) => {
    const imap = new Imap({
      user: process.env.GMAIL_USER!,
      password: process.env.GMAIL_APP_PASSWORD!,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    imap.once("ready", () => {
      imap.getBoxes((err, boxes) => {
        if (err) {
          imap.end();
          resolve(NextResponse.json({ error: err.message }, { status: 500 }));
          return;
        }

        imap.end();
        resolve(NextResponse.json({ boxes }));
      });
    });

    imap.once("error", (err: Error) => {
      console.error("IMAP error:", err);
      resolve(NextResponse.json({ error: err.message }, { status: 500 }));
    });

    imap.connect();
  });
}
