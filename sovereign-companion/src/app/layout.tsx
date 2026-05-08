import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import WelcomeListener from "@/components/WelcomeListener";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "The Sovereign Companion | 2075",
  description:
    "Design your ultimate reality. The future of companionship, engineered to perfection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-obsidian text-text-primary font-sans">
        <LanguageSwitcher />
        <WelcomeListener />
        {children}
      </body>
    </html>
  );
}
