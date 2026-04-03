import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Het Dorstige Hengsten Toernooi 2026",
  description: "Welk paard drinkt het slimst? Een bierproeverij-app met paardenthema.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-screen flex flex-col relative">
        <main className="flex-1 relative z-10 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
