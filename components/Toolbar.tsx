'use client';
import type { DocumentBlock, LightDocument } from '@/types';
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  List, Table, Image as ImageIcon, Minus, Type,
  Download, Loader2, Check
} from 'lucide-react';

interface ToolbarProps {
  activeBlock: DocumentBlock | null;
  doc: LightDocument;
  onBlockChange: (changes: Partial<DocumentBlock>) => void;
  onDocChange: (changes: Partial<LightDocument>) => void;
  onAddBlock: (type: DocumentBlock['type']) => void;
  onExport: (format: 'lpdx' | 'pdf' | 'docx') => void;
  exporting: boolean;
  exportDone: boolean;
  saving: boolean;
}

const FONT_SIZES = [10, 11, 12, 14, 16, 18, 24];

const TB_BTN: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  gap: 4, padding: '5px 8px', borderRadius: 'var(--radius-sm)',
  background: 'transparent', border: 'none',
  color: 'var(--text-secondary)', fontSize: 12,
  fontFamily: 'var(--font-body)', transition: 'all 0.12s',
  cursor: 'pointer', whiteSpace: 'nowrap',
};

const TB_BTN_ACTIVE: React.CSSProperties = {
  ...TB_BTN,
  background: 'var(--accent-light)',
  color: 'var(--text-accent)',
};

const SEP: React.CSSProperties = {
  width: '0.5px', background: 'var(--border-mid)', margin: '0 4px', alignSelf: 'stretch',
};

export function Toolbar({
  activeBlock, doc, onBlockChange, onDocChange,
  onAddBlock, onExport, exporting, exportDone, saving,
}: ToolbarProps) {
  const blockType = activeBlock?.type ?? 'paragraph';
  const isBold = activeBlock?.bold ?? false;
  const isItalic = activeBlock?.italic ?? false;
  const isUnderline = activeBlock?.underline ?? false;
  const align = activeBlock?.align ?? 'left';
  const fontSize = activeBlock?.fontSize ?? 11;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 2,
      padding: '5px 12px',
      background: 'var(--bg-toolbar)',
      borderBottom: '0.5px solid var(--border-mid)',
      overflowX: 'auto',
      flexShrink: 0,
    }}>
      {/* Block type selector */}
      <select
        value={blockType}
        onChange={e => onAddBlock(e.target.value as DocumentBlock['type'])}
        style={{
          fontSize: 12, color: 'var(--text-secondary)',
          background: 'var(--bg-surface)', border: '0.5px solid var(--border-mid)',
          borderRadius: 'var(--radius-sm)', padding: '4px 8px',
          fontFamily: 'var(--font-body)', cursor: 'pointer',
          marginRight: 4,
        }}
      >
        <option value="paragraph">Paragraph</option>
        <option value="heading1">Heading 1</option>
        <option value="heading2">Heading 2</option>
        <option value="heading3">Heading 3</option>
        <option value="list">List</option>
      </select>

      <div style={SEP} />

      {/* Font size */}
      <select
        value={fontSize}
        onChange={e => onBlockChange({ fontSize: Number(e.target.value) })}
        style={{
          fontSize: 12, color: 'var(--text-secondary)',
          background: 'transparent', border: '0.5px solid var(--border-mid)',
          borderRadius: 'var(--radius-sm)', padding: '4px 6px',
          fontFamily: 'var(--font-mono)', width: 52,
        }}
      >
        {FONT_SIZES.map(s => <option key={s} value={s}>{s}pt</option>)}
      </select>

      <div style={SEP} />

      {/* Bold / Italic / Underline */}
      <button style={isBold ? TB_BTN_ACTIVE : TB_BTN} onClick={() => onBlockChange({ bold: !isBold })} title="Bold">
        <Bold size={13} />
      </button>
      <button style={isItalic ? TB_BTN_ACTIVE : TB_BTN} onClick={() => onBlockChange({ italic: !isItalic })} title="Italic">
        <Italic size={13} />
      </button>
      <button style={isUnderline ? TB_BTN_ACTIVE : TB_BTN} onClick={() => onBlockChange({ underline: !isUnderline })} title="Underline">
        <Underline size={13} />
      </button>

      <div style={SEP} />

      {/* Alignment */}
      <button style={align === 'left' ? TB_BTN_ACTIVE : TB_BTN} onClick={() => onBlockChange({ align: 'left' })} title="Align left">
        <AlignLeft size={13} />
      </button>
      <button style={align === 'center' ? TB_BTN_ACTIVE : TB_BTN} onClick={() => onBlockChange({ align: 'center' })} title="Center">
        <AlignCenter size={13} />
      </button>
      <button style={align === 'right' ? TB_BTN_ACTIVE : TB_BTN} onClick={() => onBlockChange({ align: 'right' })} title="Align right">
        <AlignRight size={13} />
      </button>

      <div style={SEP} />

      {/* Insert elements */}
      <button style={TB_BTN} onClick={() => onAddBlock('list')} title="Insert list">
        <List size={13} /><span style={{ fontSize: 11 }}>List</span>
      </button>
      <button style={TB_BTN} onClick={() => onAddBlock('table')} title="Insert table">
        <Table size={13} /><span style={{ fontSize: 11 }}>Table</span>
      </button>
      <button style={TB_BTN} onClick={() => onAddBlock('image')} title="Insert image">
        <ImageIcon size={13} /><span style={{ fontSize: 11 }}>Image</span>
      </button>
      <button style={TB_BTN} onClick={() => onAddBlock('divider')} title="Insert divider">
        <Minus size={13} /><span style={{ fontSize: 11 }}>Rule</span>
      </button>

      <div style={SEP} />

      {/* Page size */}
      <select
        value={doc.meta.pageSize}
        onChange={e => onDocChange({ meta: { ...doc.meta, pageSize: e.target.value as 'A4' } })}
        style={{
          fontSize: 12, color: 'var(--text-muted)',
          background: 'transparent', border: 'none',
          fontFamily: 'var(--font-mono)', cursor: 'pointer', padding: '4px 4px',
        }}
      >
        <option value="A4">A4</option>
        <option value="Letter">Letter</option>
        <option value="A3">A3</option>
        <option value="Legal">Legal</option>
      </select>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Save status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginRight: 8, fontSize: 11, color: 'var(--text-muted)' }}>
        {saving ? (
          <><Loader2 size={11} className="animate-spin" style={{ animation: 'spin 0.8s linear infinite' }} />Saving…</>
        ) : (
          <><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--g400)', display: 'inline-block' }} />Cached locally</>
        )}
      </div>

      {/* Export button */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button
          onClick={() => onExport('lpdx')}
          disabled={exporting}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 14px', borderRadius: 'var(--radius-sm)',
            background: exporting ? 'var(--n200)' : exportDone ? 'var(--g500)' : 'var(--accent)',
            color: 'white', border: 'none', fontSize: 12, fontWeight: 500,
            fontFamily: 'var(--font-body)', transition: 'all 0.2s',
          }}
        >
          {exporting ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> :
           exportDone ? <Check size={12} /> : <Download size={12} />}
          {exporting ? 'Exporting…' : exportDone ? 'Exported!' : 'Export .lpdx'}
        </button>
        <select
          onChange={e => { if (e.target.value) { onExport(e.target.value as 'pdf' | 'docx'); e.target.value = ''; } }}
          style={{
            fontSize: 11, background: 'var(--bg-surface)', color: 'var(--text-secondary)',
            border: '0.5px solid var(--border-mid)', borderRadius: 'var(--radius-sm)',
            padding: '5px 6px', fontFamily: 'var(--font-body)', cursor: 'pointer',
          }}
        >
          <option value="">Also export as…</option>
          <option value="pdf">PDF</option>
          <option value="docx">DOCX</option>
        </select>
      </div>
    </div>
  );
}
