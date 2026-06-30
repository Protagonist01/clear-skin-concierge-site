import type { Metadata } from "next";
import { Cormorant_Garamond, IBM_Plex_Mono, Manrope } from "next/font/google";
import "./globals.css";

import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import Concierge from "@/components/modules/Concierge";
import SkinQuiz from "@/components/modules/SkinQuiz";

const cormorant = Cormorant_Garamond({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Clear Skin - Aesthetic Clinic & Skincare",
  description:
    "A clinician-led aesthetic clinic and precision skincare house. London, Dubai, and Lagos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full ${cormorant.variable} ${manrope.variable} ${ibmPlexMono.variable}`}
    >
      <body className="relative min-h-screen overflow-x-hidden bg-page text-ink antialiased">
        <div aria-hidden="true" className="site-atmosphere">
          <span className="site-orb site-orb-one" />
          <span className="site-orb site-orb-two" />
          <span className="site-orb site-orb-three" />
          <span className="site-grid" />
        </div>
        <div className="relative z-10 flex min-h-screen flex-col">
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <Concierge />
        <SkinQuiz />
      </body>
    </html>
  );
}
