import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppThemeProvider } from "@/components/theme-provider";

/** Rounded geometric sans — in the same spirit as Airbnb’s marketing UI, not generic Inter. */
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-app-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "౨ৎ",
  description:
    "An interactive map of favorite restaurants, nature, nightlife, and activities from cities around the world.",
};

export default function RootLayout({ 
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <AppThemeProvider>{children}</AppThemeProvider>
      </body>
    </html>
  );
}
