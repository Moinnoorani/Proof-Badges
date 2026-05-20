import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import "./globals.css";
import { Providers } from "./providers";
import { WalletButton } from "@/components/wallet-button";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Proof — On-Chain Badges",
  description: "Claim and create POAP-style achievement badges on Base Sepolia. Connect your wallet to get started.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Providers>
          <header className="flex items-center justify-between border-b px-6 py-3">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-lg font-bold">
                Proof
              </Link>
              <nav className="flex gap-4 text-sm">
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Home
                </Link>
                <Link
                  href="/creator"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Creator
                </Link>
                <Link
                  href="/me"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  My Badges
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <WalletButton />
            </div>
          </header>
          {children}
        </Providers>
      </body>
    </html>
  );
}
