import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { DappProvider } from "@/components/DappProvider";
export const metadata: Metadata = {
  title: "Trustlayer — Trade with confidence",
  description:
    "Wallet-connected Solana escrow. Clear agreements, transparent payments, and verifiable settlement.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <DappProvider>
          <a className="skip-link" href="#main-content">
            Skip to main content
          </a>
          <SiteHeader />
          {children}
          <SiteFooter />
        </DappProvider>
      </body>
    </html>
  );
}
