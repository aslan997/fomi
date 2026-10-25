import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "Fomi — Frontend Assessment",
    template: "%s · Fomi",
  },
  description: "Fomi frontend developer assessment: a faithful mockup implementation and an original AI image workspace.",
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: a pre-paint script may set a theme attribute on <html>.
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
