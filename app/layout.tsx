import type { Metadata } from "next";
import { Audiowide, Inter } from "next/font/google";
import "./globals.css";

const audioWide = Audiowide({
  variable: "--font-audiowide",
  subsets: ["latin"],
  weight: ["400"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "QueryIQ",
  description: "AI-powered data assistant that connects to your database",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${audioWide.variable} antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}
