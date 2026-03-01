'use client';

import { borderRadius } from '@/lib/theme';

interface BookCoverProps {
  title: string;
  category?: { name: string } | null;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const GRADIENT_PAIRS = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#a18cd1', '#fbc2eb'],
  ['#fccb90', '#d57eeb'],
  ['#e0c3fc', '#8ec5fc'],
  ['#f5576c', '#ff8a65'],
  ['#667eea', '#38f9d7'],
  ['#d97706', '#fbbf24'],
  ['#8b5cf6', '#c084fc'],
];

export function BookCover({ title, category, width = 150, height = 200, style }: BookCoverProps) {
  const hash = hashString(title);
  const pair = GRADIENT_PAIRS[hash % GRADIENT_PAIRS.length];
  const firstChar = title.charAt(0) || '?';

  return (
    <div
      style={{
        width,
        height,
        background: `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`,
        borderRadius: borderRadius.md,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        ...style,
      }}
    >
      <span
        style={{
          fontSize: Math.min(width, height) * 0.4,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.85)',
          textTransform: 'uppercase',
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        {firstChar}
      </span>
      {category && height >= 80 && (
        <span
          style={{
            position: 'absolute',
            bottom: 6,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: Math.max(9, Math.min(11, width * 0.07)),
            color: 'rgba(255,255,255,0.75)',
            backgroundColor: 'rgba(0,0,0,0.25)',
            padding: '2px 8px',
            borderRadius: borderRadius.xl,
            whiteSpace: 'nowrap',
            maxWidth: '90%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {category.name}
        </span>
      )}
    </div>
  );
}
