import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "UIScore - Instant AI Design Feedback",
  description:
    "Score any website's design in seconds. Get AI-powered feedback on typography, color, spacing, layout, and polish.",
  openGraph: {
    title: "UIScore - Instant AI Design Feedback",
    description:
      "Score any website's design in seconds. AI-powered design analysis.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UIScore - Instant AI Design Feedback",
    description:
      "Score any website's design in seconds. AI-powered design analysis.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
