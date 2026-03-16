'use client';
import { useState } from 'react';
import type { CachedDocument } from '@/types';
import { formatBytes } from '@/lib/compression';
import {
  FileText, Plus, ScanLine, Upload, Trash2,
  HardDrive, ChevronDown, BookOpen
} from 'lucide-react';

interface SidebarProps {
  documents: CachedDocument[];
  activeDocId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onScanClick: () => void;
  onImportClick: () => void;
  storageUsed: number;
}

export function Sidebar({
  documents, activeDocId, onSelect, onCreate, onDelete,
  onScanClick, onImportClick, storageUsed,
}: SidebarProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (confirmDelete === id) {
      onDelete(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 2500);
    }
  }

  const totalSaved = documents.reduce((acc, d) => {
    if (d.stats) return acc + (d.stats.originalSize - d.stats.compressedSize);
    return acc;
  }, 0);

  return (
    <aside style={{
      width: 232,
      minWidth: 232,
      background: 'var(--bg-sidebar)',
      borderRight: '0.5px solid var(--border-mid)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: '0.5px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 30,
          height: 30,
          background: 'var(--accent)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <BookOpen size={15} color="white" strokeWidth={2} />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            LightDoc
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
            STUDIO
          </div>
        </div>
        <div style={{
          marginLeft: 'auto',
          fontSize: 10,
          padding: '2px 7px',
          background: 'var(--accent-light)',
          color: 'var(--text-accent)',
          borderRadius: 20,
          fontWeight: 500,
          letterSpacing: '0.04em',
        }}>
          .lpdx
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: '10px 10px 6px', display: 'flex', gap: 6 }}>
        <button
          onClick={onCreate}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 5, padding: '7px 0', borderRadius: 'var(--radius-sm)',
            background: 'var(--accent)', color: 'white', border: 'none',
            fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-body)',
            transition: 'opacity 0.15s',
          }}
          onMouseOver={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseOut={e => (e.currentTarget.style.opacity = '1')}
        >
          <Plus size={13} />
          New
        </button>
        <button
          onClick={onScanClick}
          title="Scan document"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '7px 10px', borderRadius: 'var(--radius-sm)',
            background: 'transparent', color: 'var(--text-secondary)',
            border: '0.5px solid var(--border-mid)', fontSize: 12,
            transition: 'all 0.15s',
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <ScanLine size={13} />
        </button>
        <button
          onClick={onImportClick}
          title="Import PDF or DOCX"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '7px 10px', borderRadius: 'var(--radius-sm)',
            background: 'transparent', color: 'var(--text-secondary)',
            border: '0.5px solid var(--border-mid)', fontSize: 12,
            transition: 'all 0.15s',
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <Upload size={13} />
        </button>
      </div>

      {/* Document list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 6px' }}>
        <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', padding: '6px 8px 4px', letterSpacing: '0.07em' }}>
          DOCUMENTS ({documents.length})
        </div>

        {documents.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: 12 }}>
            No documents yet.<br />Create or import one.
          </div>
        )}

        {documents.map((cached, i) => {
          const isActive = cached.doc.meta.id === activeDocId;
          const reduction = cached.stats?.reductionPercent ?? 0;
          return (
            <div
              key={cached.doc.meta.id}
              onClick={() => onSelect(cached.doc.meta.id)}
              className="animate-slide"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 8px',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                background: isActive ? 'var(--bg-card)' : 'transparent',
                border: isActive ? '0.5px solid var(--border-mid)' : '0.5px solid transparent',
                marginBottom: 2,
                transition: 'all 0.12s',
                animationDelay: `${i * 0.04}s`,
                position: 'relative',
              }}
              onMouseOver={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.5)'; }}
              onMouseOut={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{
                width: 28, height: 32, flexShrink: 0,
                background: isActive ? 'var(--accent-light)' : 'var(--border-light)',
                borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '0.5px solid var(--border-light)',
              }}>
                <FileText size={13} color={isActive ? 'var(--accent)' : 'var(--text-muted)'} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: isActive ? 500 : 400,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  lineHeight: 1.3,
                }}>
                  {cached.doc.meta.title || 'Untitled'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {new Date(cached.doc.meta.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </span>
                  {reduction > 0 && (
                    <span style={{
                      fontSize: 10, color: 'var(--text-accent)',
                      background: 'var(--accent-light)',
                      padding: '1px 5px', borderRadius: 10, fontWeight: 500,
                    }}>
                      ↓{reduction}%
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => handleDelete(e, cached.doc.meta.id)}
                title={confirmDelete === cached.doc.meta.id ? 'Click again to confirm' : 'Delete'}
                style={{
                  opacity: 0, padding: 4, borderRadius: 4, border: 'none',
                  background: confirmDelete === cached.doc.meta.id ? '#fde8e8' : 'transparent',
                  color: confirmDelete === cached.doc.meta.id ? 'var(--red)' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                  position: 'absolute',
                  right: 6,
                }}
                className="doc-delete-btn"
              >
                <Trash2 size={11} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Storage footer */}
      <div style={{
        padding: '10px 14px',
        borderTop: '0.5px solid var(--border-light)',
        fontSize: 11,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <HardDrive size={11} color="var(--text-muted)" />
          <span style={{ color: 'var(--text-muted)' }}>Device cache</span>
          <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
            {formatBytes(storageUsed)}
          </span>
        </div>
        <div style={{
          height: 3, background: 'var(--border-light)', borderRadius: 2, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min((storageUsed / (50 * 1024 * 1024)) * 100, 100)}%`,
            background: 'var(--accent)',
            borderRadius: 2,
            transition: 'width 0.4s ease',
          }} />
        </div>
        {totalSaved > 0 && (
          <div style={{ marginTop: 5, color: 'var(--text-accent)', fontSize: 10, fontWeight: 500 }}>
            ↓ {formatBytes(totalSaved)} saved vs scanned PDF
          </div>
        )}
        <div style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: 10 }}>
          No server · no cloud · no tracking
        </div>
      </div>

      <style>{`
        .doc-delete-btn { opacity: 0 !important; }
        div:hover > .doc-delete-btn { opacity: 1 !important; }
      `}</style>
    </aside>
  );
}
