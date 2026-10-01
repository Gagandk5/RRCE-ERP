"use client";


export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-5 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">{children}</div>
    </div>
  );
}
