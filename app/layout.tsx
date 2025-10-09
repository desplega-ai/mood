import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mood Tracker",
  description: "Track founder mood during startup journey",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
