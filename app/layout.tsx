import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Suspense } from "react";
import Alert from "@/components/ui/Alert";
import NavShell from "@/components/layout/NavShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "Overtime",
  description: "Tournaments and leagues for Rocket League and beyond"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Suspense>
          <Alert />
        </Suspense>
        <div className="flex min-h-screen flex-col md:flex-row">
          <NavShell>
            <Navbar />
          </NavShell>
          <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
        </div>
        <Footer />
      </body>
    </html>
  );
}
