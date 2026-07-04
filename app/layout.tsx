import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AccessibilityManager } from "@/components/accessibility-manager";
import { getSiteUrl } from "@/lib/site-url";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  title: "OrderFlow - Social commerce, organized",
  description: "One checkout link for every social media order.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable} suppressHydrationWarning>
        <AccessibilityManager />
        {children}
      </body>
    </html>
  );
}
