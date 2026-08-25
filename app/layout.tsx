import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "ProfitPilot — Automated BTC Options on Delta Exchange",
  description: "Institutional-grade, self-custodial BTC options selling engine. Sells volatility, manages dynamic wings, enforces liquidation buffers on Delta Exchange India & Global.",
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
    <html lang="en" className="dark" data-theme="dark">
      <body className={`${inter.className} min-h-screen bg-[#0C0D10] text-[#F3F2EF] antialiased selection:bg-brand-500/30 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
