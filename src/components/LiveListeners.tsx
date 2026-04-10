"use client";

import { useEffect, useState } from "react";

/** ランダムなセッションIDを生成（タブを閉じるまで保持） */
function getSessionId(): string {
  const key = "icmb-session";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(key, id);
  }
  return id;
}

export default function LiveListeners() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const sessionId = getSessionId();

    const sendHeartbeat = async () => {
      try {
        const res = await fetch("/api/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const { count } = await res.json() as { count: number };
        setCount(count);
      } catch {
        // 失敗しても表示に影響しない
      }
    };

    // 初回すぐ送信 → 以降30秒ごと
    sendHeartbeat();
    const timer = setInterval(sendHeartbeat, 30_000);

    // タブを閉じた時の後始末は TTL(60s) に任せる
    return () => clearInterval(timer);
  }, []);

  // Upstash未設定(count=0)または取得前は非表示
  if (!count || count < 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-2 px-4"
      style={{
        background: "linear-gradient(90deg, rgba(184,128,10,0.08), rgba(184,128,10,0.14), rgba(184,128,10,0.08))",
        borderBottom: "1px solid rgba(184,128,10,0.2)",
      }}>
      {/* 点滅ドット */}
      <span style={{
        display: "inline-block",
        width: 7, height: 7, borderRadius: "50%",
        background: "#6BAF96",
        boxShadow: "0 0 6px #6BAF96",
        animation: "live-pulse 2s ease-in-out infinite",
        flexShrink: 0,
      }} />
      <p style={{
        color: "#8B6A4A",
        fontSize: 11,
        letterSpacing: "0.08em",
        fontFamily: "var(--font-nunito), 'Nunito', 'M PLUS Rounded 1c', sans-serif",
      }}>
        いま <strong style={{ color: "#B8800A", fontSize: 13 }}>{count}</strong> 名がアイスクリームミュージックを再生中
      </p>
      <style>{`
        @keyframes live-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
