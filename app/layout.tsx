import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { Hexagon } from "lucide-react";
import "./globals.css";
import { Providers } from "./providers";
import { WalletButton } from "@/components/wallet-button";
import { AuroraBackground } from "@/components/aurora-background";
import { Toaster } from "@/components/ui/sonner";

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
  description:
    "Claim and create POAP-style achievement badges on Base Sepolia. Connect your wallet to get started.",
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/creator", label: "Creator" },
  { href: "/me", label: "My Badges" },
];

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
          <AuroraBackground />
          <header className="sticky top-0 z-40 w-full">
            <div className="glass border-b border-white/5 backdrop-saturate-150">
              <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
                <div className="flex items-center gap-8">
                  <Link
                    href="/"
                    className="group flex items-center gap-2.5"
                    aria-label="Proof — Home"
                  >
                    <span
                      className="relative flex size-8 items-center justify-center rounded-lg ring-1 ring-white/10"
                      style={{
                        background:
                          "linear-gradient(135deg, hsl(var(--violet)), hsl(var(--indigo)) 50%, hsl(var(--cyan)))",
                      }}
                    >
                      <Hexagon
                        className="size-4 text-white drop-shadow-[0_2px_8px_rgba(168,85,247,0.6)]"
                        strokeWidth={2}
                      />
                      <span
                        aria-hidden
                        className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        style={{
                          boxShadow:
                            "0 0 24px hsla(268 95% 65% / 0.6), 0 0 48px hsla(192 95% 60% / 0.35)",
                        }}
                      />
                    </span>
                    <span className="text-gradient text-lg font-semibold tracking-tight">
                      Proof
                    </span>
                  </Link>

                  <nav className="hidden items-center gap-1 sm:flex">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="group relative rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <span className="relative z-10">{link.label}</span>
                        <span
                          aria-hidden
                          className="absolute inset-0 rounded-full bg-white/[0.04] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        />
                        <span
                          aria-hidden
                          className="absolute -bottom-0.5 left-1/2 h-px w-0 -translate-x-1/2 transition-all duration-300 group-hover:w-2/3"
                          style={{
                            background:
                              "linear-gradient(90deg, transparent, hsl(var(--violet)), hsl(var(--cyan)), transparent)",
                          }}
                        />
                      </Link>
                    ))}
                  </nav>
                </div>

                <div className="flex items-center gap-3">
                  {/* Mobile nav fallback — compact links */}
                  <nav className="flex items-center gap-1 sm:hidden">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="rounded-full px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                  <WalletButton />
                </div>
              </div>
            </div>
          </header>

          <main className="relative">{children}</main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
