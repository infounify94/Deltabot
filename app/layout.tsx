import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"], 
  display: "swap",
  variable: "--font-inter" 
});

const ibmPlexMono = IBM_Plex_Mono({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-mono" 
});

export const metadata: Metadata = {
  title: "ProfitPilot — Automated Crypto Options Trading",
  description: "ProfitPilot automates your options trading, monitors your positions, manages risk and gives you a clear view of your account. Non-custodial. Delta Exchange.",
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
    <html lang="en" data-theme="light" suppressHydrationWarning className={`${inter.variable} ${ibmPlexMono.variable}`}>
      <body className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans antialiased selection:bg-[#d97706]/15 selection:text-[#172033]">
        {children}
      </body>
    </html>
  );
}
