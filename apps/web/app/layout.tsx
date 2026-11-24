import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TRUSTLAYER — Trade with confidence",
  description:
    "Non-custodial USDC escrow on Solana. Agree on terms, secure payment, complete with clear settlement rules.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className="font-sans min-h-screen flex flex-col">
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <SiteHeader />
        <main id="main-content" className="flex-1 w-full">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
