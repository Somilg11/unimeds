import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const description =
  "Find doctors, book appointments at clinics near you, and keep your medical records in one place. Unimeds also helps clinics run online booking, schedules and records.";

export const metadata: Metadata = {
  metadataBase: process.env.AUTH_URL ? new URL(process.env.AUTH_URL) : undefined,
  title: { default: "Unimeds — book doctors and clinics online", template: "%s · Unimeds" },
  description,
  applicationName: "Unimeds",
  openGraph: {
    type: "website",
    siteName: "Unimeds",
    title: "Unimeds — book doctors and clinics online",
    description,
    locale: "en_IN",
  },
  twitter: { card: "summary", title: "Unimeds", description },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(inter.variable, geistMono.variable, "h-full", "antialiased", "font-sans")}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
