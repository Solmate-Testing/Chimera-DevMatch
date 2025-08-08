import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "../components/Providers";
import { Layout } from "../components/Layout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chimera DevMatch - AI Marketplace",
  description: "Decentralized AI marketplace for agents, MCPs, and trading bots with gasless transactions",
  keywords: "AI, Web3, Blockchain, Gasless, Oasis, Ethereum, Privy, Biconomy, Marketplace",
  authors: [{ name: "Chimera DevMatch Team" }],
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <Layout>
            {children}
          </Layout>
        </Providers>
      </body>
    </html>
  );
}