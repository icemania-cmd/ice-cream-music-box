import type { Metadata } from "next";
import { M_PLUS_Rounded_1c, Shippori_Mincho } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${mplus.variable} ${shippori.variable} h-full`}>
      <body
        className="min-h-full flex flex-col"
        style={{
          fontFamily: "var(--font-mplus), 'M PLUS Rounded 1c', sans-serif",
        }}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
