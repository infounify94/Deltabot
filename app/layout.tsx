import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "ProfitPilot 2.0 — Quantitative Crypto Options Intelligence & Execution",
  description: "Quantitative crypto options intelligence and automated execution platform for Delta Exchange. Systematic volatility analysis, dynamic defense, and risk-controlled options architecture.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-[var(--paper)] text-[var(--ink)] antialiased selection:bg-[#f59e0b]/20 selection:text-[#0f172a]`}>
        {children}
      </body>
    </html>
  );
}
