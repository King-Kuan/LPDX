'use client';
import { useState } from 'react';
import type { LightDocument, CompressionStats, CompressionMode } from '@/types';
import { formatBytes, estimateCompression, estimateDocumentSize } from '@/lib/compression';
import { Zap, Settings2, BarChart3, Info } from 'lucide-react';

interface RightPanelProps {
  doc: LightDocument;
  stats: CompressionStats | null;
  onDocChange: (changes: Partial<LightDocument>) => void;
}

const MODES: { key: CompressionMode; label: string; desc: string }[] = [
  { key: 'balanced',   label: 'Balanced',   desc: '~70% reduction, high quality' },
  { key: 'aggressive', label: 'Aggressive', desc: '~80% reduction, lower quality' },
  { key: 'quality',    label: 'Quality',    desc: '~55% reduction, best quality' },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 32, height: 18, borderRadius: 9, cursor: 'pointer',
        background: checked ? 'var(--accent)' : 'var(--border-dark)',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3, width: 12, height: 12,
        borderRadius: '50%', background: 'white',
        left: checked ? 17 : 3,
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  );
}

export function RightPanel({ doc, stats, onDocChange }: RightPanelProps) {
  const [tab, setTab] = useState<'compress' | 'settings'>('compress');

  const liveStats = stats || estimateCompression(doc, estimateDocumentSize(doc) * 4);
  const origSize = liveStats.originalSize;
  const newSize = liveStats.compressedSize;
  const pct = liveStats.reductionPercent;

  const circumference = 2 * Math.PI * 24;
  const strokeOffset = circumference - (pct / 100) * circumference;

  return (
    <aside style={{
      width: 248,
      minWidth: 248,
      background: 'var(--bg-surface)',
      borderLeft: '0.5px solid var(--border-mid)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Panel tabs */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border-mid)' }}>
        {[
          { key: 'compress', icon: <BarChart3 size={12} />, label: 'Compression' },
          { key: 'settings', icon: <Settings2 size={12} />, label: 'Settings' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 5, padding: '10px 0', border: 'none', cursor: 'pointer',
              fontSize: 11, fontFamily: 'var(--font-body)', fontWeight: 500,
              background: tab === t.key ? 'var(--bg-card)' : 'transparent',
              color: tab === t.key ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* ── Compression tab ── */}
        {tab === 'compress' && (
          <div>
            {/* Circular progress */}
            <div style={{ padding: '20px 16px 12px', textAlign: 'center' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <svg width={72} height={72} viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="var(--border-light)" strokeWidth="4" />
                  <circle
                    cx="28" cy="28" r="24" fill="none"
                    stroke="var(--accent)" strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    transform="rotate(-90 28 28)"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                </svg>
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>
                    {pct}%
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginTop: 6 }}>
                Size reduction
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                vs scanned PDF
              </div>
            </div>

            {/* Size comparison */}
            <div style={{ padding: '0 14px 12px', display: 'flex', gap: 8 }}>
              <div style={{
                flex: 1, background: 'var(--bg-page)', borderRadius: 'var(--radius-md)',
                padding: '10px 12px', border: '0.5px solid var(--border-light)',
              }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Scanned PDF</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {formatBytes(origSize)}
                </div>
              </div>
              <div style={{
                flex: 1, background: 'var(--accent-light)', borderRadius: 'var(--radius-md)',
                padding: '10px 12px', border: '0.5px solid var(--g200)',
              }}>
                <div style={{ fontSize: 10, color: 'var(--text-accent)', marginBottom: 3 }}>.lpdx output</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>
                  {formatBytes(newSize)}
                </div>
              </div>
            </div>

            {/* Technique breakdown */}
            <div style={{ padding: '0 14px 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.06em' }}>
                TECHNIQUE BREAKDOWN
              </div>
              {[
                { label: 'OCR vector text layer', value: liveStats.ocrSaving, tip: 'Replaces raster scan with searchable text' },
                { label: 'AVIF image compression', value: liveStats.imageSaving, tip: 'Modern codec vs raw JPEG/PNG' },
                { label: 'PDF stream optimization', value: liveStats.streamSaving, tip: 'Object dedup & stream compression' },
                { label: 'Font subsetting', value: liveStats.fontSaving, tip: 'Only used glyphs embedded' },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-accent)', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
                      −{item.value}%
                    </span>
                  </div>
                  <div style={{ height: 4, background: 'var(--border-light)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${Math.min(item.value, 100)}%`,
                      background: 'var(--accent)', borderRadius: 2,
                      transition: 'width 0.6s ease',
                      opacity: item.value > 0 ? 1 : 0.3,
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Compression mode */}
            <div style={{ padding: '0 14px 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.06em' }}>
                COMPRESSION MODE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {MODES.map(m => (
                  <button
                    key={m.key}
                    onClick={() => onDocChange({ compressionMode: m.key })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                      borderRadius: 'var(--radius-md)', border: '0.5px solid',
                      borderColor: doc.compressionMode === m.key ? 'var(--accent)' : 'var(--border-light)',
                      background: doc.compressionMode === m.key ? 'var(--accent-light)' : 'transparent',
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: doc.compressionMode === m.key ? 'var(--accent)' : 'var(--border-dark)',
                    }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: doc.compressionMode === m.key ? 'var(--text-accent)' : 'var(--text-primary)' }}>
                        {m.label}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{m.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Image quality slider */}
            <div style={{ padding: '0 14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Image quality</span>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>
                  {doc.imageQuality}%
                </span>
              </div>
              <input
                type="range" min={30} max={95} step={5}
                value={doc.imageQuality}
                onChange={e => onDocChange({ imageQuality: Number(e.target.value) })}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                <span>Smallest</span>
                <span>Lossless</span>
              </div>
            </div>

            {/* Compatibility note */}
            <div style={{ margin: '0 14px 14px', padding: '10px 12px', background: 'var(--bg-page)', borderRadius: 'var(--radius-md)', border: '0.5px solid var(--border-light)' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <Info size={11} color="var(--accent)" style={{ marginTop: 1, flexShrink: 0 }} />
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  .lpdx files are valid ISO 32000 PDFs. They open in Adobe Acrobat, Chrome, macOS Preview, and all Android/iOS PDF apps — no plugins needed.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Settings tab ── */}
        {tab === 'settings' && (
          <div style={{ padding: '14px' }}>
            <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.06em' }}>
              PROCESSING OPTIONS
            </div>

            {[
              { key: 'enableOCR', label: 'OCR text layer', desc: 'Extract text from scanned pages' },
              { key: 'embedFonts', label: 'Embed fonts', desc: 'Include font subsets in output' },
              { key: 'pdfArchival', label: 'PDF/A archival mode', desc: 'ISO 19005 long-term archival' },
            ].map(opt => (
              <div key={opt.key} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0', borderBottom: '0.5px solid var(--border-light)',
              }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{opt.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{opt.desc}</div>
                </div>
                <Toggle
                  checked={doc[opt.key as keyof LightDocument] as boolean}
                  onChange={v => onDocChange({ [opt.key]: v })}
                />
              </div>
            ))}

            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.06em' }}>
                DOCUMENT METADATA
              </div>
              {[
                { key: 'author', label: 'Author', placeholder: 'Document author' },
                { key: 'organization', label: 'Organization', placeholder: 'Your organization' },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    {field.label}
                  </label>
                  <input
                    placeholder={field.placeholder}
                    style={{
                      width: '100%', padding: '7px 10px', fontSize: 12,
                      border: '0.5px solid var(--border-mid)', borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card)', color: 'var(--text-primary)',
                      fontFamily: 'var(--font-body)', outline: 'none',
                    }}
                  />
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.06em' }}>
                STORAGE
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--bg-page)', borderRadius: 'var(--radius-md)', border: '0.5px solid var(--border-light)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  All documents are cached in your browser's IndexedDB. Nothing is stored on any server.
                </div>
                <div style={{ marginTop: 8, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {['Device-only', 'No tracking', 'No cloud'].map(tag => (
                    <span key={tag} style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 10,
                      background: 'var(--accent-light)', color: 'var(--text-accent)', fontWeight: 500,
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
