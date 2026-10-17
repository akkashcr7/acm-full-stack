import type { Metadata } from "next";
import "./globals.css";
import { AceProvider } from "@/context/ace-context";
import { Navbar } from "@/components/navbar";
import { OfflineBanner } from "@/components/offline-banner";

export const metadata: Metadata = {
  title: "Team ACE | Offline-First Competition Judging Platform",
  description:
    "Autonomous robotics competition judging engine with offline IndexedDB sync, conflict resolution, live animated leaderboard, and 2-sigma anomaly detection.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#00F0FF" />
      </head>
      <body className="min-h-screen bg-background text-slate-100 antialiased selection:bg-primary/30 selection:text-white">
        <AceProvider>
          <div className="relative min-h-screen flex flex-col">
            <Navbar />
            <OfflineBanner />
            <main className="flex-1">{children}</main>
          </div>
        </AceProvider>
      </body>
    </html>
  );
}
