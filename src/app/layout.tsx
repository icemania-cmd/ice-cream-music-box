import type { Metadata, Viewport } from "next";
import { M_PLUS_Rounded_1c, Nunito } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import RegisterSW from "@/components/RegisterSW";
import InstallBanner from "@/components/InstallBanner";
import "./globals.css";

const mplus = M_PLUS_Rounded_1c({
  weight: ["400", "500", "700", "800"],
  subsets: ["latin"],
  variable: "--font-mplus",
  display: "swap",
});

const nunito = Nunito({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ICE CREAM MUSIC BOX",
  description: "アイスクリームの歌だけを集めたアイスクリーム特化型ミュージックボックス。あいぱく会場のBGMが楽しめます。",
  manifest: "/manifest.json",
  // iOS Safari用: ホーム画面追加時の設定
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ICE CREAM MUSIC BOX",
  },
  // アイコン
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    // iOSホーム画面アイコン（apple-touch-icon）
    apple: [
      { url: "/icon-512.png", sizes: "512x512" },
    ],
  },
};

// theme-color は viewport exportで設定（App Router推奨）
export const viewport: Viewport = {
  themeColor: "#C8860A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${mplus.variable} ${nunito.variable} h-full`}>
      <head>
        {/* beforeinstallprompt を React hydration より前にキャプチャ */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__icmb_installPrompt=e;});`,
          }}
        />
      </head>
      <body
        className="min-h-full flex flex-col"
        style={{
          fontFamily: "var(--font-nunito), var(--font-mplus), 'Nunito', 'M PLUS Rounded 1c', sans-serif",
        }}
      >
        {children}
        <Analytics />
        <RegisterSW />
        <InstallBanner />
      </body>
    </html>
  );
}
