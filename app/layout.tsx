import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Synapse Engine - Next.js Blueprint Studio",
  description: "Constitutional Visual IDE for Next.js 15 & React 19",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-synapse-bg text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
