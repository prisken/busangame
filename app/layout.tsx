import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Profi Annual Planning 2026🇰🇷",
  description: "Team game for Busan trip",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
