"use client";

import { Track } from "@/lib/tracks";

type Props = {
  track: Track;
  isPlaying: boolean;
  size?: number;
};

// SVG ice cream album art
export default function AlbumArt({ track, isPlaying, size = 200 }: Props) {
  return (
    <div
      className={`album-spin${isPlaying ? " playing" : ""}`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, #fff8f0 0%, ${track.color} 60%, ${track.color}cc 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 8px 32px ${track.color}66, 0 2px 8px rgba(0,0,0,0.15)`,
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* decorative pattern */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        style={{ position: "absolute", inset: 0 }}
      >
        <circle cx="100" cy="100" r="98" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
        <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <circle cx="100" cy="100" r="40" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        {/* dots pattern */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x = 100 + 85 * Math.cos(rad);
          const y = 100 + 85 * Math.sin(rad);
          return (
            <circle key={angle} cx={x} cy={y} r="3" fill="rgba(255,255,255,0.5)" />
          );
        })}
      </svg>
      {/* Ice cream emoji center */}
      <div
        style={{
          position: "absolute",
          fontSize: size * 0.3,
          userSelect: "none",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
        }}
      >
        🍦
      </div>
      {/* center hole */}
      <div
        style={{
          position: "absolute",
          width: size * 0.08,
          height: size * 0.08,
          borderRadius: "50%",
          background: "#FFF8F0",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </div>
  );
}
