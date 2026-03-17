'use client';
import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { readFileAsDataURL, readFileAsArrayBuffer, extractPdfText, importDocxText } from '@/lib/ocr';
import { formatBytes } from '@/lib/compression';

interface ImportModalProps {
  onClose: () => void;
  onImport: (title: string, blocks: { type: string; content: string }[]) => void;
}

type ImportStep = 'drop' | 'processing' | 'preview' | 'error';

interface ParsedImport {
  title: string;
  blocks: { type: string; content: string }[];
  originalSize: number;
  fileType: string;
}

export function ImportModal({ onClose, onImport }: ImportModalProps) {
  const [step, setStep] = useState<ImportStep>('drop');
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setStep('processing');
    setProgress(0);
    setProgressLabel('Reading file…');

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      const originalSize = file.size;
      let title = file.name.replace(/\.[^.]+$/, '');
      let rawText = '';
      let fileType = '';

      setProgress(20);

      if (ext === 'pdf') {
        fileType = 'PDF';
        setProgressLabel('Parsing PDF structure…');
        const buffer = await readFileAsArrayBuffer(file);
        setProgress(40);
        setProgressLabel('Extracting text content…');
        rawText = await extractPdfText(buffer);
        setProgress(75);
      } else if (ext === 'docx' || ext === 'doc') {
        fileType = 'DOCX';
        setProgressLabel('Parsing Word document…');
        const buffer = await readFileAsArrayBuffer(file);
        setProgress(40);
        rawText = await importDocxText(buffer);
        setProgress(75);
      } else if (['jpg', 'jpeg', 'png', 'webp', 'bmp'].includes(ext)) {
        fileType = 'Image';
        setProgressLabel('Running OCR on image…');
        const { runOCR } = await import('@/lib/ocr');
        const dataUrl = await readFileAsDataURL(file);
        setProgress(20);
        const result = await runOCR(dataUrl, (pct) => {
          setProgress(20 + Math.round(pct * 0.7));
          setProgressLabel(`OCR processing… ${pct}%`);
        });
        rawText = result.text;
        title = `Scanned — ${file.name.replace(/\.[^.]+$/, '')}`;
        setProgress(90);
      } else {
        throw new Error(`Unsupported file type: .${ext}`);
      }

      setProgressLabel('Converting to .lpdx blocks…');
      setProgress(90);

      // Convert raw text into document blocks
      const blocks = parseTextToBlocks(rawText);

      setProgress(100);
      setProgressLabel('Done!');

      setParsed({ title, blocks, originalSize, fileType });
      setStep('preview');

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      setErrorMsg(msg);
      setStep('error');
    }
  }, []);

  function parseTextToBlocks(text: string): { type: string; content: string }[] {
    if (!text.trim()) return [{ type: 'paragraph', content: '[No text content found — image may need OCR processing]' }];

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const blocks: { type: string; content: string }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Heuristic: short ALL-CAPS or very short lines at start = heading
      if (i === 0 || (line.length < 60 && line === line.toUpperCase() && line.length > 3)) {
        blocks.push({ type: i === 0 ? 'heading1' : 'heading2', content: line });
      } else if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || /^\d+\./.test(line)) {
        blocks.push({ type: 'list', content: line.replace(/^[•\-*\d.]\s*/, '') });
      } else if (line.length < 50 && i > 0) {
        // Short lines mid-document might be subheadings
        blocks.push({ type: 'heading3', content: line });
      } else {
        // Merge consecutive paragraph lines
        if (blocks.length > 0 && blocks[blocks.length - 1].type === 'paragraph') {
          blocks[blocks.length - 1].content += ' ' + line;
        } else {
          blocks.push({ type: 'paragraph', content: line });
        }
      }
    }

    return blocks;
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleImport() {
    if (!parsed) return;
    onImport(parsed.title, parsed.blocks);
    onClose();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(10, 10, 8, 0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-xl)',
        border: '0.5px solid var(--border-mid)',
        width: '100%', maxWidth: 540,
        maxHeight: '88vh',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        animation: 'fadeIn 0.2s ease',
        boxShadow: 'var(--shadow-doc)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '16px 20px', borderBottom: '0.5px solid var(--border-light)',
        }}>
          <div style={{
            width: 32, height: 32, background: 'var(--accent-light)',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Upload size={15} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Import Document</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>PDF, DOCX, or image — converted to .lpdx</div>
          </div>
          <button onClick={onClose} style={{
            marginLeft: 'auto', background: 'transparent', border: 'none',
            color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 4,
          }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* ── Drop zone ── */}
          {step === 'drop' && (
            <div style={{ padding: '24px 20px' }}>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `1.5px dashed ${dragOver ? 'var(--accent)' : 'var(--border-mid)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '40px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragOver ? 'var(--accent-light)' : 'var(--bg-page)',
                  transition: 'all 0.2s',
                }}
              >
                <Upload size={32} color={dragOver ? 'var(--accent)' : 'var(--text-muted)'} style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 500, color: dragOver ? 'var(--text-accent)' : 'var(--text-primary)', marginBottom: 6 }}>
                  Drop file here or click to browse
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  PDF, DOCX, DOC, JPG, PNG, WEBP
                </div>
              </div>

              <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.webp,.bmp" onChange={handleFileInput} style={{ display: 'none' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 16 }}>
                {[
                  { type: 'PDF', desc: 'Text extracted & re-encoded', saving: '~68%' },
                  { type: 'DOCX', desc: 'Converted to .lpdx blocks', saving: '~45%' },
                  { type: 'Image', desc: 'OCR applied, text layer added', saving: '~78%' },
                ].map(item => (
                  <div key={item.type} style={{
                    padding: '12px', background: 'var(--bg-page)',
                    borderRadius: 'var(--radius-md)', border: '0.5px solid var(--border-light)',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 3 }}>{item.type}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, lineHeight: 1.5 }}>{item.desc}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-accent)', fontWeight: 500 }}>{item.saving} smaller</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Processing ── */}
          {step === 'processing' && (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <Loader2 size={36} color="var(--accent)" style={{ animation: 'spin 0.8s linear infinite', marginBottom: 16 }} />
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                {progressLabel}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>
                Processing on your device — no upload required
              </div>
              <div style={{ height: 6, background: 'var(--border-light)', borderRadius: 3, overflow: 'hidden', margin: '0 40px' }}>
                <div style={{
                  height: '100%', width: `${progress}%`,
                  background: 'var(--accent)', borderRadius: 3,
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {progress}%
              </div>
            </div>
          )}

          {/* ── Preview ── */}
          {step === 'preview' && parsed && (
            <div style={{ padding: '16px 20px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                background: 'var(--accent-light)', borderRadius: 'var(--radius-md)',
                marginBottom: 16, border: '0.5px solid var(--g200)',
              }}>
                <CheckCircle size={16} color="var(--accent)" />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-accent)' }}>
                    {parsed.fileType} imported — {parsed.blocks.length} blocks detected
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--g600)' }}>
                    Original: {formatBytes(parsed.originalSize)} · Estimated .lpdx: {formatBytes(Math.round(parsed.originalSize * 0.28))}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Document title
              </div>
              <input
                value={parsed.title}
                onChange={e => setParsed({ ...parsed, title: e.target.value })}
                style={{
                  width: '100%', padding: '8px 12px', marginBottom: 14,
                  border: '0.5px solid var(--border-mid)', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-page)', color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none',
                }}
              />

              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.06em' }}>
                CONTENT PREVIEW ({parsed.blocks.length} blocks)
              </div>
              <div style={{
                maxHeight: 240, overflowY: 'auto', padding: '10px 12px',
                background: 'var(--bg-page)', borderRadius: 'var(--radius-md)',
                border: '0.5px solid var(--border-light)', marginBottom: 16,
              }}>
                {parsed.blocks.slice(0, 12).map((block, i) => (
                  <div key={i} style={{
                    marginBottom: 6, paddingBottom: 6,
                    borderBottom: i < 11 ? '0.5px solid var(--border-light)' : 'none',
                  }}>
                    <span style={{
                      fontSize: 9, padding: '1px 6px', borderRadius: 10,
                      background: block.type.startsWith('heading') ? 'var(--accent-light)' : 'var(--bg-card)',
                      color: block.type.startsWith('heading') ? 'var(--text-accent)' : 'var(--text-muted)',
                      border: '0.5px solid var(--border-light)',
                      marginRight: 6, fontWeight: 500, letterSpacing: '0.04em',
                    }}>
                      {block.type.toUpperCase()}
                    </span>
                    <span style={{
                      fontSize: 12,
                      fontWeight: block.type.startsWith('heading') ? 500 : 400,
                      color: 'var(--text-secondary)',
                    }}>
                      {block.content.slice(0, 80)}{block.content.length > 80 ? '…' : ''}
                    </span>
                  </div>
                ))}
                {parsed.blocks.length > 12 && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', paddingTop: 4 }}>
                    +{parsed.blocks.length - 12} more blocks
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep('drop')} style={{
                  padding: '9px 18px', borderRadius: 'var(--radius-md)',
                  border: '0.5px solid var(--border-mid)', background: 'transparent',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: 12,
                }}>
                  Back
                </button>
                <button onClick={handleImport} style={{
                  flex: 1, padding: '9px', borderRadius: 'var(--radius-md)',
                  background: 'var(--accent)', color: 'white', border: 'none',
                  cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <FileText size={14} />
                  Import as new .lpdx document
                </button>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {step === 'error' && (
            <div style={{ padding: '32px 24px', textAlign: 'center' }}>
              <AlertCircle size={32} color="var(--red)" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6 }}>Import failed</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>{errorMsg}</div>
              <button onClick={() => setStep('drop')} style={{
                padding: '9px 24px', borderRadius: 'var(--radius-md)',
                background: 'var(--accent)', color: 'white', border: 'none',
                cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12,
              }}>
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
