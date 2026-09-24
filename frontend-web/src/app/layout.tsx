import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

export const metadata: Metadata = {
  title: "RRCE ERP - RajaRajeswari College of Engineering",
  description: "Higher Education ERP System for RRCE under VTU/AICTE Framework",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
