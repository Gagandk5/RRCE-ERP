import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ProfileProvider } from "@/components/ProfileContext";

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
        <ProfileProvider>
          <Navbar />
          <main className="min-w-0 flex-1 w-full lg:pl-64">{children}</main>
        </ProfileProvider>
      </body>
    </html>
  );
}
