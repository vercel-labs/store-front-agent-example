import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { Chat } from "@/components/agent/chat";
import { Header } from "@/components/header";
import { hasDatabase } from "@/lib/db";

import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Northstar Goods",
  description: "A small storefront with an AI shopping assistant, built to try out Vercel.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-screen font-sans">
        {/* proxy.ts rewrites every route to /setup while DATABASE_URL is missing. */}
        {hasDatabase && <Header />}
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        {hasDatabase && <Chat />}
      </body>
    </html>
  );
}
