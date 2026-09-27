import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "RRCE ERP - Rajarajeswari College of Engineering",
  description: "Production-Grade College ERP System for Rajarajeswari College of Engineering (RRCE), Bangalore. Autonomous Institution under VTU.",
  icons: {
    icon: [
      { url: "/images.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/images.svg",
    apple: "/images.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased">
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/images.svg" alt="RRCE Logo" className="w-8 h-8 object-contain shrink-0" />
              <div>
                <p className="font-semibold text-slate-300">
                  Rajarajeswari College of Engineering (RRCE)
                </p>
                <p className="text-[11px] text-slate-500">
                  Mysore Road, Bengaluru, Karnataka 560074 • Autonomous Institution under VTU
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>Next.js 15 App Router</span>
              <span>•</span>
              <span>PostgreSQL & Prisma ORM</span>
              <span>•</span>
              <span>Single Vercel Deployment</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
