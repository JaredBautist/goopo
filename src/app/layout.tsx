import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AgeGate } from "@/components/layout/age-gate";
import { NavbarServer } from "@/components/layout/navbar-ssr";
import { Footer } from "@/components/layout/footer";
import { AppBackground } from "@/components/layout/app-background";
import { LiveWinnersToast } from "@/components/layout/live-winners-toast";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#090b10",
};

export const metadata: Metadata = {
  title: {
    default: "Goopo — Pronostica, compite y descubre tu suerte",
    template: "%s · Goopo",
  },
  description:
    "Plataforma de pronósticos entre participantes con moneda virtual sin valor real.",
  icons: { icon: "/logo.svg" },
  openGraph: {
    title: "Goopo — Pronostica, compite y descubre tu suerte",
    description:
      "Plataforma de pronósticos entre participantes. Sin dinero real.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <Script id="goopo-theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('goopo_theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}})()`}
        </Script>
      </head>
      <body className={`${inter.variable} ${sora.variable} font-sans antialiased relative min-h-screen`}>
        <AppBackground />
        <NavbarServer />
        <main className="min-h-dvh pt-14 pb-20 md:pb-0">{children}</main>
        <Footer />
        <AgeGate />
        <Toaster />
        <LiveWinnersToast />
      </body>
    </html>
  );
}
