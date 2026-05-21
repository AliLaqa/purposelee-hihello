import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyHello",
  description: "Internal digital business cards with shareable links and QR codes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
