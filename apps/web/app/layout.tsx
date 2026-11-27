import type { Metadata, Viewport } from "next";
import "./globals.css";
import { InstallApp } from "@/components/InstallApp";
export const viewport: Viewport = { themeColor: "#176c50" };
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AccountProvider } from "@/components/AccountProvider";
import { DappProvider } from "@/components/DappProvider";
export const metadata: Metadata = {
  applicationName: "Trustlayer",
  appleWebApp: {
    capable: true,
    title: "Trustlayer",
    statusBarStyle: "default",
  },
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
        <AccountProvider>
          <DappProvider>
            <a className="skip-link" href="#main-content">
              Skip to main content
            </a>
            <SiteHeader />
            {children}
            <InstallApp />
            <SiteFooter />
          </DappProvider>
        </AccountProvider>
      </body>
    </html>
  );
}
