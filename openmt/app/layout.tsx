import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "OpenMT — Unified Personal Media Hub & Decision Engine",
  description:
    "A self-hosted, personal media tracker, backlog manager, and anti-paralysis decision engine for anime, manga, TV shows, movies, and books.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark font-sans">
      <body className="min-h-full flex flex-col bg-[#f4f2fb] text-slate-700">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
