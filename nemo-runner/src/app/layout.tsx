import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { configSystem } from "@/lib/game/core/ConfigurationSystem";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NEMO Underwater Runner",
  description: "An underwater endless runner game.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fogColor = configSystem.getLightingConfig().fogColor;
  const fogHex = `#${fogColor.toString(16).padStart(6, '0')}`;
  return (
    <html lang="en">
      <body
        className={inter.className}
        style={{ margin: 0, padding: 0, backgroundColor: fogHex }}
      >
        {children}
      </body>
    </html>
  );
}
