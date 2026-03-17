'use client';
import type { LightDocument, CompressionStats } from '@/types';
import { formatBytes } from '@/lib/compression';

interface StatusBarProps {
  doc: LightDocument | null;
  stats: CompressionStats | null;
  wordCount: number;
  charCount: number;
}

export function StatusBar({ doc, stats, wordCount, charCount }: StatusBarProps) {
  if (!doc) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0,
      padding: '4px 16px',
      background: 'var(--bg-toolbar)',
      borderTop: '0.5px solid var(--border-light)',
      fontSize: 11,
      color: 'var(--text-muted)',
      flexShrink: 0,
      fontFamily: 'var(--font-mono)',
    }}>
      <span>{wordCount.toLocaleString()} words</span>
      <Dot />
      <span>{charCount.toLocaleString()} chars</span>
      <Dot />
      <span>{doc.blocks.length} blocks</span>
      <Dot />
      <span>{doc.meta.pageSize}</span>

      {stats && (
        <>
          <Dot />
          <span style={{ color: 'var(--text-accent)', fontWeight: 500 }}>
            ↓{stats.reductionPercent}% vs scanned PDF
          </span>
          <Dot />
          <span>.lpdx {formatBytes(stats.compressedSize)}</span>
        </>
      )}

      <div style={{ flex: 1 }} />

      <span style={{ color: 'var(--text-accent)' }}>
        <span style={{
          display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
          background: 'var(--g400)', marginRight: 5, verticalAlign: 'middle',
        }} />
        Cached on device · No server
      </span>
    </div>
  );
}

function Dot() {
  return (
    <span style={{ margin: '0 8px', color: 'var(--border-dark)' }}>·</span>
  );
}
