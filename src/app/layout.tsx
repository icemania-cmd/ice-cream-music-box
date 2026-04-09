import type { Metadata } from "next";
import { M_PLUS_Rounded_1c, Shippori_Mincho } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import RegisterSW from "@/components/RegisterSW";
import "./globals.css";

const mplus = M_PLUS_Rounded_1c({
  weight: ["400", "500", "700", "800"],
  subsets: ["latin"],
  variable: "--font-mplus",
  display: "swap",
});

const shippori = Shippori_Mincho({
  weight: ["400", "500", "700", "800"],
  subsets: ["latin"],
  variable: "--font-shippori",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ICE CREAM MUSIC BOX",
  description: "アイスクリームの歌だけを集めたアイスクリーム特化型ミュージックボックス。あいぱく会場のBGMが楽しめます。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ICE CREAM MUSIC BOX",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${mplus.variable} ${shippori.variable} h-full`}>
      <head>
        <meta name="theme-color" content="#C8860A" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ICE CREAM MUSIC BOX" />
      </head>
      <body
        className="min-h-full flex flex-col"
        style={{
          fontFamily: "var(--font-mplus), 'M PLUS Rounded 1c', sans-serif",
        }}
      >
        {children}
        <Analytics />
        <RegisterSW />
      </body>
    </html>
  );
}
