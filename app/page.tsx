'use client';
import { useState, useMemo, useCallback } from 'react';
import { useDocumentStore } from '@/hooks/useDocumentStore';
import { Sidebar } from '@/components/Sidebar';
import { Toolbar } from '@/components/Toolbar';
import { DocumentEditor } from '@/components/DocumentEditor';
import { RightPanel } from '@/components/RightPanel';
import { StatusBar } from '@/components/StatusBar';
import { ScanModal } from '@/components/ScanModal';
import { ImportModal } from '@/components/ImportModal';
import { exportDocument, triggerDownload } from '@/lib/export';
import type { DocumentBlock, LightDocument } from '@/types';

export default function Home() {
  const {
    documents, activeDoc, activeDocId, stats, saving,
    updateDoc, updateBlock, addBlock, deleteBlock,
    selectDocument, createDocument, removeDocument,
  } = useDocumentStore();

  const [focusedBlock, setFocusedBlock] = useState<DocumentBlock | null>(null);
  const [showScan, setShowScan] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  const { wordCount, charCount } = useMemo(() => {
    if (!activeDoc) return { wordCount: 0, charCount: 0 };
    const allText = activeDoc.blocks.map(b => b.content).join(' ');
    return {
      wordCount: allText.trim().split(/\s+/).filter(Boolean).length,
      charCount: allText.length,
    };
  }, [activeDoc]);

  const storageUsed = useMemo(() =>
    documents.reduce((sum, d) => sum + (d.size || 0), 0), [documents]);

  const handleExport = useCallback(async (format: 'lpdx' | 'pdf' | 'docx') => {
    if (!activeDoc || exporting) return;
    setExporting(true);
    setExportDone(false);
    try {
      const bytes = await exportDocument(activeDoc, format);
      const safeTitle = activeDoc.meta.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'document';
      const ext = format === 'lpdx' ? 'lpdx' : 'pdf';
      triggerDownload(bytes, `${safeTitle}.${ext}`, 'application/pdf');
      setExportDone(true);
      setTimeout(() => setExportDone(false), 3000);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }, [activeDoc, exporting]);

  const handleScanInsert = useCallback((text: string, imageData?: string) => {
    if (!activeDoc) return;
    const lastId = activeDoc.blocks[activeDoc.blocks.length - 1]?.id ?? null;
    if (imageData) {
      const imgId = addBlock(lastId, 'image');
      setTimeout(() => {
        updateDoc(doc => ({
          ...doc,
          blocks: doc.blocks.map(b => b.id === imgId ? { ...b, imageData } : b),
        }));
      }, 100);
    }
    if (text.trim()) {
      text.split('\n').filter(l => l.trim()).forEach((line, i) => {
        const id = addBlock(null, 'paragraph');
        setTimeout(() => {
          updateDoc(doc => ({
            ...doc,
            blocks: doc.blocks.map(b => b.id === id ? { ...b, content: line.trim() } : b),
          }));
        }, 150 + i * 50);
      });
    }
  }, [activeDoc, addBlock, updateDoc]);

  const handleImport = useCallback((title: string, blocks: { type: string; content: string }[]) => {
    createDocument(title);
    setTimeout(() => {
      updateDoc(doc => ({
        ...doc,
        meta: { ...doc.meta, title },
        blocks: blocks.map((b, i) => ({
          id: `imp_${Date.now()}_${i}`,
          type: b.type as DocumentBlock['type'],
          content: b.content,
        })),
      }));
    }, 300);
  }, [createDocument, updateDoc]);

  if (!activeDoc) {
    return (
      <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-page)' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:48, height:48, background:'var(--accent)', borderRadius:12, margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center', animation:'pulse 1.5s ease-in-out infinite' }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="1" width="12" height="16" rx="2" fill="white" opacity="0.9"/><rect x="8" y="5" width="12" height="16" rx="2" fill="white" opacity="0.4"/></svg>
          </div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:18, color:'var(--text-primary)' }}>Loading LightDoc Studio…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <Sidebar
          documents={documents} activeDocId={activeDocId}
          onSelect={selectDocument} onCreate={() => createDocument()}
          onDelete={removeDocument} onScanClick={() => setShowScan(true)}
          onImportClick={() => setShowImport(true)} storageUsed={storageUsed}
        />
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <Toolbar
            activeBlock={focusedBlock} doc={activeDoc}
            onBlockChange={changes => focusedBlock && updateBlock(focusedBlock.id, changes)}
            onDocChange={changes => updateDoc(doc => ({ ...doc, ...changes }))}
            onAddBlock={type => { const lastId = activeDoc.blocks[activeDoc.blocks.length-1]?.id ?? null; addBlock(lastId, type); }}
            onExport={handleExport} exporting={exporting} exportDone={exportDone} saving={saving}
          />
          <DocumentEditor
            doc={activeDoc}
            onBlockChange={(id, changes) => updateBlock(id, changes)}
            onAddBlock={(afterId, type) => addBlock(afterId, type)}
            onDeleteBlock={deleteBlock}
            onDocMetaChange={changes => updateDoc(doc => ({ ...doc, meta: { ...doc.meta, ...changes } }))}
            onFocusBlock={setFocusedBlock}
          />
          <StatusBar doc={activeDoc} stats={stats} wordCount={wordCount} charCount={charCount} />
        </div>
        <RightPanel
          doc={activeDoc} stats={stats}
          onDocChange={changes => updateDoc(doc => ({ ...doc, ...changes }))}
        />
      </div>
      {showScan && <ScanModal onClose={() => setShowScan(false)} onInsert={handleScanInsert} imageQuality={activeDoc.imageQuality} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onImport={handleImport} />}
    </div>
  );
}
