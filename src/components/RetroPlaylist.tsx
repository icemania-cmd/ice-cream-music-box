"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Track } from "@/lib/tracks";

const PAGE_SIZE = 10;

const FONT = "var(--font-nunito), 'Nunito', 'M PLUS Rounded 1c', sans-serif";
const BRAND = "#D65076";

type Props = {
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  playCounts: Record<number, number>;
  onSelect: (idx: number) => void;
};

export default function RetroPlaylist({
  tracks, currentIndex, isPlaying, playCounts, onSelect,
}: Props) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = query.trim().toLowerCase();
  const isSearching = trimmed.length > 0;

  // 検索フィルタリング
  const filtered = isSearching
    ? tracks.filter((t) => t.title.toLowerCase().includes(trimmed))
    : tracks;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  // 再生中の曲があるページに自動ジャンプ（検索中は無効）
  useEffect(() => {
    if (isSearching) return;
    const targetPage = Math.floor(currentIndex / PAGE_SIZE);
    setPage(targetPage);
  }, [currentIndex, isSearching]);

  // 検索クエリが変わったらページをリセット
  useEffect(() => {
    setPage(0);
  }, [query]);

  const displayedItems = isSearching
    ? filtered
    : filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* ── 検索ボックス ── */}
      <div style={{ padding: "10px 12px 8px", borderBottom: "1px solid #EDE0CA" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#FFFBF5",
            border: `1.5px solid #E0CEB0`,
            borderRadius: 10,
            padding: "0 10px",
            transition: "border-color 0.2s",
          }}
          onFocusCapture={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = BRAND;
          }}
          onBlurCapture={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = "#E0CEB0";
          }}
        >
          <Search size={14} color="#C4A882" strokeWidth={2} style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="曲名を検索…"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 13,
              color: "#3D2010",
              fontFamily: FONT,
              padding: "9px 0",
              minWidth: 0,
            }}
          />
          {query.length > 0 && (
            <button
              onClick={handleClear}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 2,
                display: "flex",
                alignItems: "center",
                borderRadius: "50%",
                color: "#B09070",
                flexShrink: 0,
              }}
              aria-label="クリア"
            >
              <X size={14} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* 検索結果件数 */}
        {isSearching && (
          <p style={{
            marginTop: 5,
            fontSize: 10,
            color: "#9B7A58",
            fontFamily: FONT,
            letterSpacing: "0.04em",
          }}>
            {filtered.length > 0
              ? `${filtered.length}件ヒット`
              : "該当する曲が見つかりませんでした"}
          </p>
        )}
      </div>

      {/* ── 曲リスト ── */}
      <div className="playlist-scroll" style={{ flex: 1 }}>
        {displayedItems.length === 0 && isSearching ? (
          <div style={{
            padding: "32px 16px",
            textAlign: "center",
            color: "#C4A882",
            fontSize: 13,
            fontFamily: FONT,
          }}>
            🍦 見つかりませんでした
          </div>
        ) : (
          displayedItems.map((t) => {
            // 元のインデックスを解決（検索時は tracks 全体から探す）
            const originalIdx = tracks.indexOf(t);
            const isCurrent = originalIdx === currentIndex;
            const playCount = playCounts[t.id] ?? t.plays;

            return (
              <button
                key={t.id}
                onClick={() => onSelect(originalIdx)}
                className="w-full text-left flex items-center gap-3 px-4 py-2.5 transition-colors retro-list-item"
                style={{
                  background: isCurrent ? "#FFF8F0" : "transparent",
                  borderLeft: isCurrent ? `3px solid #C8860A` : "3px solid transparent",
                  cursor: "pointer",
                }}
              >
                {/* 番号 */}
                <span
                  className="tabular-nums flex-shrink-0 text-right"
                  style={{
                    fontSize: 11,
                    width: 20,
                    color: isCurrent ? "#C8860A" : "#B09070",
                    fontFamily: FONT,
                  }}
                >
                  {String(originalIdx + 1).padStart(2, "0")}
                </span>

                {/* イコライザー / ドット */}
                <div className="flex-shrink-0 flex items-end gap-0.5" style={{ width: 18, height: 18 }}>
                  {isCurrent && isPlaying ? (
                    <>
                      <div className="eq-bar1 rounded-sm" style={{ width: 3.5, background: "#C8860A", borderRadius: 1 }} />
                      <div className="eq-bar2 rounded-sm" style={{ width: 3.5, background: "#D4961A", borderRadius: 1 }} />
                      <div className="eq-bar3 rounded-sm" style={{ width: 3.5, background: "#C8860A", borderRadius: 1 }} />
                    </>
                  ) : (
                    <div style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: isCurrent ? "#C8860A" : t.color,
                      opacity: isCurrent ? 1 : 0.7,
                      marginBottom: 1,
                    }} />
                  )}
                </div>

                {/* 曲情報 */}
                <div className="flex-1 min-w-0">
                  <p
                    style={{
                      color: isCurrent ? "#2A1208" : "#3D2010",
                      fontFamily: isCurrent ? FONT : "inherit",
                      letterSpacing: isCurrent ? "0.02em" : "normal",
                      fontSize: 14, fontWeight: isCurrent ? 700 : 400,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}
                  >
                    {t.title}
                  </p>
                  <p style={{ color: "#9B7A58", fontSize: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {t.genre}
                  </p>
                </div>

                {/* 再生回数 */}
                <span
                  className="flex-shrink-0 tabular-nums"
                  style={{
                    fontSize: 10,
                    color: isCurrent ? "#B8800A" : "#C4A882",
                    fontFamily: FONT,
                    minWidth: 32,
                    textAlign: "right",
                  }}
                >
                  {playCount >= 1000
                    ? `${(playCount / 1000).toFixed(1)}k`
                    : playCount > 0 ? String(playCount) : ""}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* ── ページネーション（検索中は非表示） ── */}
      {!isSearching && totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "8px 12px",
            borderTop: "1px solid #EDE0CA",
            background: "#FFFBF5",
            flexWrap: "wrap",
          }}
        >
          {/* 前へ */}
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 8,
              border: "1.5px solid #E0CEB0",
              background: page === 0 ? "transparent" : "#FFF8F0",
              color: page === 0 ? "#D0B898" : "#8B6A4A",
              cursor: page === 0 ? "default" : "pointer",
              transition: "all 0.15s",
            }}
            aria-label="前のページ"
          >
            <ChevronLeft size={16} strokeWidth={2} />
          </button>

          {/* ページ番号ボタン */}
          {Array.from({ length: totalPages }, (_, i) => {
            const isActive = i === page;
            const showBtn =
              i === 0 ||
              i === totalPages - 1 ||
              Math.abs(i - page) <= 1;
            const showEllipsisBefore = i === 1 && page > 2;
            const showEllipsisAfter = i === totalPages - 2 && page < totalPages - 3;

            if (!showBtn) return null;

            return (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                {showEllipsisBefore && (
                  <span style={{ color: "#C4A882", fontSize: 11, padding: "0 2px" }}>…</span>
                )}
                <button
                  onClick={() => setPage(i)}
                  style={{
                    minWidth: 36,
                    height: 36,
                    borderRadius: 8,
                    border: isActive ? `2px solid ${BRAND}` : "1.5px solid #E0CEB0",
                    background: isActive ? `rgba(214,80,118,0.08)` : "transparent",
                    color: isActive ? BRAND : "#8B6A4A",
                    fontWeight: isActive ? 700 : 400,
                    fontSize: 12,
                    fontFamily: FONT,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    padding: "0 4px",
                  }}
                  aria-current={isActive ? "page" : undefined}
                >
                  {i + 1}
                </button>
                {showEllipsisAfter && (
                  <span style={{ color: "#C4A882", fontSize: 11, padding: "0 2px" }}>…</span>
                )}
              </span>
            );
          })}

          {/* 次へ */}
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 8,
              border: "1.5px solid #E0CEB0",
              background: page === totalPages - 1 ? "transparent" : "#FFF8F0",
              color: page === totalPages - 1 ? "#D0B898" : "#8B6A4A",
              cursor: page === totalPages - 1 ? "default" : "pointer",
              transition: "all 0.15s",
            }}
            aria-label="次のページ"
          >
            <ChevronRight size={16} strokeWidth={2} />
          </button>

          {/* ページ情報 */}
          <span style={{
            fontSize: 10,
            color: "#B09070",
            fontFamily: FONT,
            letterSpacing: "0.04em",
            marginLeft: 4,
          }}>
            {page + 1} / {totalPages}ページ
          </span>
        </div>
      )}
    </div>
  );
}
