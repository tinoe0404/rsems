import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "RSEMS - Radiotherapy Side Effect Monitoring",
  description: "Electronic monitoring system for radiotherapy side effects in cancer patients - Zimbabwe",
  manifest: "/manifest.json",
};

import { Toaster } from "sonner";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#00897B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <OfflineIndicator />
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}

