import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LifeOSProvider } from "@/components/LifeOSProvider";
import { BottomNav } from "@/components/BottomNav";
import { QuickAddModal } from "@/components/QuickAddModal";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Life OS",
  description: "Personal life management system",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} antialiased bg-zinc-950 text-white min-h-screen pb-16 selection:bg-indigo-500/30`}
      >
        <LifeOSProvider>
          <main className="max-w-md mx-auto w-full min-h-screen bg-zinc-950 shadow-2xl overflow-x-hidden relative">
            {children}
            <BottomNav />
            <QuickAddModal />
          </main>
        </LifeOSProvider>
      </body>
    </html>
  );
}
