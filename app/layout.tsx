import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Predalea – Predicción de Mercados",
  description: "La plataforma de predicción de mercados para LATAM. Apuesta en eventos reales y gana.",
};

import { TonProvider } from "@/components/TonProvider";
import { WalletGuard } from "@/components/WalletGuard";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-[family-name:var(--font-inter)] bg-white text-slate-900 antialiased">
        <TonProvider>
          <WalletGuard>
            {children}
          </WalletGuard>
        </TonProvider>
      </body>
    </html>
  );
}
