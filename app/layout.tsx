import type { Metadata } from "next";
import { Audiowide, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import 'katex/dist/katex.min.css';
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";

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
    <ClerkProvider>
      <html lang="en" className="dark">
        <body
          className={`${inter.variable} ${audioWide.variable} antialiased font-sans`}
        >
          <div
            className="absolute inset-0 -z-10 bg-white dark:bg-black"
            style={{
              backgroundImage: `
      linear-gradient(to right, rgba(229,231,235,0.15) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(229,231,235,0.15) 1px, transparent 1px),
      radial-gradient(circle 600px at 20% 100%, rgba(255,255,255,0.2), transparent),
      radial-gradient(circle 600px at 100% 80%, rgba(255,255,255,0.1), transparent)
    `,
              backgroundSize: "48px 48px, 48px 48px, 100% 100%, 100% 100%",
            }}
          />

          <SidebarProvider defaultOpen={false} className="[--sidebar-width: 14rem]" >{children}</SidebarProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
