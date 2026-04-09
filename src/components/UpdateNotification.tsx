"use client";

import { useEffect, useState } from "react";

export default function UpdateNotification() {
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const e = event as CustomEvent<ServiceWorkerRegistration>;
      setRegistration(e.detail);
    };
    window.addEventListener("swUpdate", handleUpdate);
    return () => window.removeEventListener("swUpdate", handleUpdate);
  }, []);

  if (!registration) return null;

  const handleUpdate = () => {
    registration.waiting?.postMessage({ type: "SKIP_WAITING" });
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{ fontFamily: "var(--font-mplus), 'M PLUS Rounded 1c', sans-serif" }}
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-[#D65076]/40 bg-[#1B0A04]/95 px-5 py-3.5 shadow-xl backdrop-blur-md"
    >
      {/* アイコン */}
      <span className="text-xl" aria-hidden>🍦</span>

      {/* テキスト */}
      <span className="whitespace-nowrap text-sm font-medium text-white/90">
        新しいバージョンがあります
      </span>

      {/* 更新ボタン */}
      <button
        onClick={handleUpdate}
        className="rounded-xl bg-[#D65076] px-4 py-1.5 text-sm font-bold text-white transition-opacity hover:opacity-80 active:opacity-70"
      >
        更新
      </button>

      {/* 閉じるボタン */}
      <button
        onClick={() => setRegistration(null)}
        aria-label="閉じる"
        className="ml-1 text-white/40 transition-colors hover:text-white/80"
      >
        ✕
      </button>
    </div>
  );
}
