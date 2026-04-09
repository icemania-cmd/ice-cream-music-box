// フラットデザインのSVGアイコン群（lucide非依存）
type P = { size?: number; color?: string; className?: string };

export function IconPlay({ size = 24, color = "currentColor" }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polygon points="7,3 21,12 7,21" fill={color} />
    </svg>
  );
}

export function IconPause({ size = 24, color = "currentColor" }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="3" width="5" height="18" rx="1.5" fill={color} />
      <rect x="15" y="3" width="5" height="18" rx="1.5" fill={color} />
    </svg>
  );
}

export function IconNext({ size = 24, color = "currentColor" }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polygon points="4,4 16,12 4,20" fill={color} />
      <rect x="17" y="4" width="3.5" height="16" rx="1.5" fill={color} />
    </svg>
  );
}

export function IconPrev({ size = 24, color = "currentColor" }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polygon points="20,4 8,12 20,20" fill={color} />
      <rect x="3.5" y="4" width="3.5" height="16" rx="1.5" fill={color} />
    </svg>
  );
}

export function IconShuffle({ size = 24, color = "currentColor", active = false }: P & { active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={active ? 1 : 0.45}>
      {/* 上ライン：左→右上 */}
      <path d="M3 7 Q10 7 14 12 Q18 17 21 17" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* 下ライン：左→右下 */}
      <path d="M3 17 Q7 17 10 14" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M14 10 Q17 7 21 7" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* 右矢印上 */}
      <polygon points="19,4 24,7 19,10" fill={color} />
      {/* 右矢印下 */}
      <polygon points="19,14 24,17 19,20" fill={color} />
    </svg>
  );
}

export function IconRepeat({ size = 24, color = "currentColor", active = false }: P & { active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={active ? 1 : 0.45}>
      <path d="M4 10 Q4 5 9 5 L18 5" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
      <polygon points="16,2 21,5 16,8" fill={color} />
      <path d="M20 14 Q20 19 15 19 L6 19" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
      <polygon points="8,16 3,19 8,22" fill={color} />
    </svg>
  );
}

export function IconRepeatOne({ size = 24, color = "currentColor" }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 10 Q4 5 9 5 L18 5" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
      <polygon points="16,2 21,5 16,8" fill={color} />
      <path d="M20 14 Q20 19 15 19 L6 19" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
      <polygon points="8,16 3,19 8,22" fill={color} />
      <text x="12" y="14" textAnchor="middle" fontSize="7" fontWeight="bold" fill={color} fontFamily="monospace">1</text>
    </svg>
  );
}

export function IconVolume({ size = 24, color = "currentColor" }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polygon points="3,9 9,9 14,4 14,20 9,15 3,15" fill={color} />
      <path d="M17 8 Q21 12 17 16" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function IconMute({ size = 24, color = "currentColor" }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polygon points="3,9 9,9 14,4 14,20 9,15 3,15" fill={color} />
      <line x1="17" y1="8" x2="22" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="8" x2="17" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconExpand({ size = 24, color = "currentColor" }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polyline points="14,3 21,3 21,10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="21" y1="3" x2="14" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <polyline points="10,21 3,21 3,14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="3" y1="21" x2="10" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconClose({ size = 24, color = "currentColor" }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <line x1="4" y1="4" x2="20" y2="20" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="20" y1="4" x2="4" y2="20" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconList({ size = 24, color = "currentColor" }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="3" height="3" rx="1" fill={color} />
      <rect x="8" y="6" width="13" height="2" rx="1" fill={color} />
      <rect x="3" y="11" width="3" height="3" rx="1" fill={color} />
      <rect x="8" y="12" width="13" height="2" rx="1" fill={color} />
      <rect x="3" y="17" width="3" height="3" rx="1" fill={color} />
      <rect x="8" y="18" width="13" height="2" rx="1" fill={color} />
    </svg>
  );
}

export function IconTrophy({ size = 24, color = "currentColor" }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M7 3 L17 3 L17 10 Q17 16 12 17 Q7 16 7 10 Z" fill={color} />
      <path d="M4 4 L7 4 L7 9 Q5 8 4 6 Z" fill={color} opacity="0.6" />
      <path d="M20 4 L17 4 L17 9 Q19 8 20 6 Z" fill={color} opacity="0.6" />
      <rect x="10" y="17" width="4" height="3" rx="0.5" fill={color} />
      <rect x="7" y="20" width="10" height="2" rx="1" fill={color} />
    </svg>
  );
}
