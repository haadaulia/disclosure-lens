import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DisclosureLens — UK Regulatory Intelligence",
  description: "AI-powered UK company filing analysis. Live Companies House data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <body>{children}</body>
    </html>
  );
}