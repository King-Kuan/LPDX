'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import type { LightDocument, DocumentBlock } from '@/types';
import { Plus, GripVertical, Trash2, Image as ImageIcon } from 'lucide-react';
import { readFileAsDataURL } from '@/lib/ocr';
import { compressImageToAvif } from '@/lib/compression';

interface EditorProps {
  doc: LightDocument;
  onBlockChange: (blockId: string, changes: Partial<DocumentBlock>) => void;
  onAddBlock: (afterId: string | null, type?: DocumentBlock['type']) => string;
  onDeleteBlock: (blockId: string) => void;
  onDocMetaChange: (changes: Partial<LightDocument['meta']>) => void;
  onFocusBlock: (block: DocumentBlock | null) => void;
}

const BLOCK_STYLES: Record<string, React.CSSProperties> = {
  heading1: { fontSize: 26, fontWeight: 600, fontFamily: 'var(--font-display)', lineHeight: 1.25, color: 'var(--text-primary)', marginBottom: 4 },
  heading2: { fontSize: 18, fontWeight: 500, fontFamily: 'var(--font-body)', lineHeight: 1.3, color: 'var(--text-primary)', marginBottom: 2 },
  heading3: { fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-body)', lineHeight: 1.4, color: 'var(--text-secondary)' },
  paragraph: { fontSize: 13, fontWeight: 400, fontFamily: 'var(--font-body)', lineHeight: 1.85, color: 'var(--text-primary)' },
  list:      { fontSize: 13, fontWeight: 400, fontFamily: 'var(--font-body)', lineHeight: 1.85, color: 'var(--text-primary)' },
};

const PLACEHOLDERS: Record<string, string> = {
  heading1:  'Heading 1',
  heading2:  'Heading 2',
  heading3:  'Heading 3',
  paragraph: 'Start writing…',
  list:      '• List item (one per line)',
  table:     '',
  image:     '',
  divider:   '',
};

interface BlockRowProps {
  block: DocumentBlock;
  index: number;
  onChange: (changes: Partial<DocumentBlock>) => void;
  onAdd: (type?: DocumentBlock['type']) => void;
  onDelete: () => void;
  onFocus: () => void;
  imageQuality: number;
}

function BlockRow({ block, onChange, onAdd, onDelete, onFocus, imageQuality }: BlockRowProps) {
  const [hover, setHover] = useState(false);
  const [focused, setFocused] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textRef.current) {
      textRef.current.style.height = 'auto';
      textRef.current.style.height = textRef.current.scrollHeight + 'px';
    }
  }, [block.content]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && block.type !== 'list') {
      e.preventDefault();
      onAdd('paragraph');
    }
    if (e.key === 'Backspace' && block.content === '') {
      e.preventDefault();
      onDelete();
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataURL(file);
    const compressed = await compressImageToAvif(dataUrl, imageQuality);
    onChange({ imageData: compressed });
  }

  if (block.type === 'divider') {
    return (
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ position: 'relative', padding: '4px 0', margin: '8px 0' }}
      >
        <hr style={{ border: 'none', borderTop: '0.5px solid var(--border-mid)', margin: 0 }} />
        {hover && (
          <button
            onClick={onDelete}
            style={{
              position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
              background: 'var(--bg-page)', border: '0.5px solid var(--border-mid)',
              borderRadius: 4, padding: 3, cursor: 'pointer', color: 'var(--text-muted)',
              display: 'flex',
            }}
          >
            <Trash2 size={10} />
          </button>
        )}
      </div>
    );
  }

  if (block.type === 'image') {
    return (
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ position: 'relative', margin: '8px 0' }}
      >
        {block.imageData ? (
          <div>
            <img
              src={block.imageData}
              alt={block.imageCaption || 'Document image'}
              style={{ maxWidth: '100%', borderRadius: 'var(--radius-md)', border: '0.5px solid var(--border-light)' }}
            />
            <input
              value={block.imageCaption || ''}
              onChange={e => onChange({ imageCaption: e.target.value })}
              placeholder="Add caption…"
              style={{
                display: 'block', width: '100%', marginTop: 6, fontSize: 11,
                color: 'var(--text-muted)', border: 'none', outline: 'none',
                background: 'transparent', textAlign: 'center', fontFamily: 'var(--font-body)',
                fontStyle: 'italic',
              }}
            />
          </div>
        ) : (
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: '32px', border: '1.5px dashed var(--border-mid)',
            borderRadius: 'var(--radius-lg)', cursor: 'pointer', color: 'var(--text-muted)',
            background: 'var(--accent-light)', transition: 'all 0.2s',
          }}>
            <ImageIcon size={24} color="var(--accent)" />
            <span style={{ fontSize: 13, color: 'var(--text-accent)' }}>Click to upload image</span>
            <span style={{ fontSize: 11 }}>Will be AVIF compressed on export</span>
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          </label>
        )}
        {hover && block.imageData && (
          <button
            onClick={onDelete}
            style={{
              position: 'absolute', top: 6, right: 6,
              background: 'rgba(255,255,255,0.9)', border: '0.5px solid var(--border-mid)',
              borderRadius: 4, padding: 4, cursor: 'pointer', color: 'var(--red)',
              display: 'flex',
            }}
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    );
  }

  if (block.type === 'table') {
    const rows = block.tableData || [['Header 1', 'Header 2', 'Header 3'], ['', '', '']];
    return (
      <div style={{ margin: '8px 0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      border: '0.5px solid var(--border-mid)',
                      padding: '6px 10px',
                      background: ri === 0 ? 'var(--accent-light)' : 'transparent',
                      fontWeight: ri === 0 ? 500 : 400,
                    }}
                  >
                    <input
                      value={cell}
                      onChange={e => {
                        const updated = rows.map((r, rIdx) =>
                          rIdx === ri ? r.map((c, cIdx) => cIdx === ci ? e.target.value : c) : r
                        );
                        onChange({ tableData: updated });
                      }}
                      style={{
                        border: 'none', outline: 'none', background: 'transparent',
                        width: '100%', fontFamily: 'var(--font-body)',
                        fontSize: 12, color: 'var(--text-primary)',
                        fontWeight: ri === 0 ? 500 : 400,
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={() => onChange({ tableData: [...rows, new Array(rows[0]?.length || 3).fill('')] })}
          style={{
            marginTop: 4, fontSize: 11, color: 'var(--text-accent)',
            background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 0',
          }}
        >
          + Add row
        </button>
      </div>
    );
  }

  const textStyle = BLOCK_STYLES[block.type] || BLOCK_STYLES.paragraph;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: 'relative', display: 'flex', gap: 4, alignItems: 'flex-start', marginBottom: 2 }}
    >
      {/* Block controls (shown on hover) */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 2,
        opacity: hover || focused ? 1 : 0,
        transition: 'opacity 0.15s',
        paddingTop: 4, marginLeft: -36,
      }}>
        <button
          onClick={() => onAdd()}
          title="Add block below"
          style={{
            width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 4, border: 'none', background: 'var(--border-light)',
            color: 'var(--text-muted)', cursor: 'pointer',
          }}
        >
          <Plus size={11} />
        </button>
        <div style={{ cursor: 'grab', padding: 2, color: 'var(--text-muted)' }}>
          <GripVertical size={11} />
        </div>
      </div>

      {/* Block type indicator for lists */}
      {block.type === 'list' && (
        <span style={{ color: 'var(--accent)', marginTop: '0.6em', fontSize: 13, flexShrink: 0 }}>•</span>
      )}

      <textarea
        ref={textRef}
        value={block.content}
        placeholder={PLACEHOLDERS[block.type]}
        onChange={e => onChange({ content: e.target.value })}
        onKeyDown={handleKeyDown}
        onFocus={() => { setFocused(true); onFocus(); }}
        onBlur={() => setFocused(false)}
        rows={1}
        style={{
          flex: 1,
          ...textStyle,
          fontStyle: block.italic ? 'italic' : 'normal',
          fontWeight: block.bold ? 600 : (textStyle.fontWeight as number),
          textDecoration: block.underline ? 'underline' : 'none',
          textAlign: block.align || 'left',
          fontSize: block.fontSize ? `${block.fontSize}pt` : textStyle.fontSize,
          border: 'none',
          outline: 'none',
          background: focused ? 'rgba(15, 110, 58, 0.03)' : 'transparent',
          borderRadius: focused ? 'var(--radius-sm)' : 0,
          resize: 'none',
          width: '100%',
          overflow: 'hidden',
          padding: '2px 6px',
          transition: 'background 0.15s',
        }}
      />

      {/* Delete (hover) */}
      {hover && (
        <button
          onClick={onDelete}
          style={{
            position: 'absolute', right: -28, top: 4,
            background: 'transparent', border: 'none',
            color: 'var(--text-muted)', cursor: 'pointer', padding: 2, borderRadius: 4,
            opacity: 0.5, transition: 'opacity 0.1s',
          }}
          onMouseOver={e => (e.currentTarget.style.opacity = '1')}
          onMouseOut={e => (e.currentTarget.style.opacity = '0.5')}
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}

export function DocumentEditor({
  doc, onBlockChange, onAddBlock, onDeleteBlock,
  onDocMetaChange, onFocusBlock,
}: EditorProps) {
  function handleAddBlock(afterId: string | null, type?: DocumentBlock['type']) {
    const newId = onAddBlock(afterId, type);
    // Focus the new block
    setTimeout(() => {
      const el = document.querySelector(`[data-block-id="${newId}"] textarea`) as HTMLTextAreaElement;
      el?.focus();
    }, 50);
    return newId;
  }

  return (
    <div style={{
      flex: 1, overflowY: 'auto',
      padding: '32px 48px',
      background: 'var(--bg-page)',
      display: 'flex',
      justifyContent: 'center',
    }}>
      {/* Document page */}
      <div style={{
        width: '100%',
        maxWidth: 700,
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-xl)',
        border: '0.5px solid var(--border-light)',
        boxShadow: 'var(--shadow-doc)',
        padding: '56px 72px',
        minHeight: 900,
        animation: 'fadeIn 0.25s ease',
      }}>
        {/* Document header */}
        <div style={{ borderBottom: '0.5px solid var(--border-light)', paddingBottom: 20, marginBottom: 24 }}>
          <input
            value={doc.meta.title}
            onChange={e => onDocMetaChange({ title: e.target.value })}
            placeholder="Document title"
            style={{
              display: 'block', width: '100%', fontSize: 28,
              fontFamily: 'var(--font-display)', fontWeight: 400,
              color: 'var(--text-primary)', border: 'none', outline: 'none',
              background: 'transparent', lineHeight: 1.2, marginBottom: 8,
            }}
          />
          <input
            value={doc.meta.subtitle}
            onChange={e => onDocMetaChange({ subtitle: e.target.value })}
            placeholder="Subtitle or document description"
            style={{
              display: 'block', width: '100%', fontSize: 13,
              fontFamily: 'var(--font-body)', color: 'var(--text-secondary)',
              border: 'none', outline: 'none', background: 'transparent',
            }}
          />
          <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
            <input
              value={doc.meta.author}
              onChange={e => onDocMetaChange({ author: e.target.value })}
              placeholder="Author"
              style={{
                fontSize: 11, color: 'var(--text-muted)', border: 'none', outline: 'none',
                background: 'transparent', fontFamily: 'var(--font-body)', maxWidth: 160,
              }}
            />
            <input
              value={doc.meta.organization}
              onChange={e => onDocMetaChange({ organization: e.target.value })}
              placeholder="Organization"
              style={{
                fontSize: 11, color: 'var(--text-muted)', border: 'none', outline: 'none',
                background: 'transparent', fontFamily: 'var(--font-body)', maxWidth: 200,
              }}
            />
          </div>
        </div>

        {/* Blocks */}
        <div style={{ paddingLeft: 36 }}>
          {doc.blocks.map((block, i) => (
            <div key={block.id} data-block-id={block.id} style={{ marginBottom: block.type.startsWith('heading') ? 12 : 0 }}>
              <BlockRow
                block={block}
                index={i}
                imageQuality={doc.imageQuality}
                onChange={changes => onBlockChange(block.id, changes)}
                onAdd={(type) => handleAddBlock(block.id, type)}
                onDelete={() => onDeleteBlock(block.id)}
                onFocus={() => onFocusBlock(block)}
              />
            </div>
          ))}

          {/* Add block at end */}
          <div
            style={{
              marginTop: 12, padding: '12px 0',
              borderTop: '0.5px dashed var(--border-light)',
            }}
          >
            <button
              onClick={() => handleAddBlock(doc.blocks[doc.blocks.length - 1]?.id ?? null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, color: 'var(--text-muted)', background: 'transparent',
                border: 'none', cursor: 'pointer', padding: '6px 0',
                transition: 'color 0.15s',
              }}
              onMouseOver={e => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseOut={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <Plus size={13} />
              Add block
            </button>
          </div>
        </div>

        {/* Document footer */}
        <div style={{
          marginTop: 32, paddingTop: 12,
          borderTop: '0.5px solid var(--border-light)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {doc.meta.title} · .lpdx
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Page 1 · {new Date(doc.meta.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
