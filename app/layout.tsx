import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import SiteNav from "@/components/site-nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "My Tunes - Link Tracking & Music Links",
  description: "Track and redirect to custom links with music platform support",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SiteNav />
        {children}
        <Toaster />
      </body>
    </html>
  );
}

