'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import type { LightDocument, DocumentBlock, CachedDocument, CompressionStats } from '@/types';
import { saveDocument, listDocuments, deleteDocument, createNewDocument } from '@/lib/storage';
import { estimateCompression, estimateDocumentSize } from '@/lib/compression';

export function useDocumentStore() {
  const [documents, setDocuments] = useState<CachedDocument[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<LightDocument | null>(null);
  const [stats, setStats] = useState<CompressionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load all documents from IndexedDB on mount
  useEffect(() => {
    listDocuments().then((docs) => {
      setDocuments(docs);
      if (docs.length > 0) {
        setActiveDocId(docs[0].doc.meta.id);
        setActiveDoc(docs[0].doc);
        setStats(docs[0].stats);
      } else {
        // Create a starter document
        const newDoc = createNewDocument('Welcome to LightDoc Studio');
        newDoc.blocks = [
          { id: 'b1', type: 'heading1', content: 'Welcome to LightDoc Studio' },
          { id: 'b2', type: 'paragraph', content: 'This document is stored entirely on your device using IndexedDB. No data is sent to any server.' },
          { id: 'b3', type: 'heading2', content: 'What is .lpdx?' },
          { id: 'b4', type: 'paragraph', content: 'The .lpdx (LightDoc Exchange) format is a compressed PDF-compatible format that reduces file sizes by 65–80% compared to scanned PDFs while remaining readable in every PDF viewer.' },
          { id: 'b5', type: 'heading2', content: 'How compression works' },
          { id: 'b6', type: 'list', content: '', listItems: ['OCR text layer replaces rasterized scans (saves ~62%)', 'AVIF/WebP image compression replaces raw JPEG/PNG', 'PDF object stream optimization and deduplication', 'Font subsetting — only glyphs used are embedded'] },
          { id: 'b7', type: 'paragraph', content: 'Start writing, scan a document, or import an existing PDF or DOCX file using the toolbar above.' },
        ];
        const cached: CachedDocument = {
          doc: newDoc,
          stats: estimateCompression(newDoc, estimateDocumentSize(newDoc) * 4),
          size: estimateDocumentSize(newDoc),
        };
        saveDocument(cached).then(() => {
          setDocuments([cached]);
          setActiveDocId(newDoc.meta.id);
          setActiveDoc(newDoc);
          setStats(cached.stats);
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Auto-save with debounce
  const persistDocument = useCallback((doc: LightDocument) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaving(true);
    saveTimer.current = setTimeout(async () => {
      const size = estimateDocumentSize(doc);
      const origSize = size * 4; // simulate original scanned size
      const compression = estimateCompression(doc, origSize);
      const cached: CachedDocument = { doc, stats: compression, size };
      await saveDocument(cached);
      setStats(compression);
      setDocuments(prev => {
        const idx = prev.findIndex(d => d.doc.meta.id === doc.meta.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = cached;
          return next;
        }
        return [cached, ...prev];
      });
      setSaving(false);
    }, 800);
  }, []);

  const updateDoc = useCallback((updater: (doc: LightDocument) => LightDocument) => {
    setActiveDoc(prev => {
      if (!prev) return prev;
      const updated = updater({ ...prev, meta: { ...prev.meta, updatedAt: Date.now() } });
      persistDocument(updated);
      return updated;
    });
  }, [persistDocument]);

  const updateBlock = useCallback((blockId: string, changes: Partial<DocumentBlock>) => {
    updateDoc(doc => ({
      ...doc,
      blocks: doc.blocks.map(b => b.id === blockId ? { ...b, ...changes } : b),
    }));
  }, [updateDoc]);

  const addBlock = useCallback((afterId: string | null, type: DocumentBlock['type'] = 'paragraph') => {
    const newBlock: DocumentBlock = {
      id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      content: '',
    };
    updateDoc(doc => {
      if (!afterId) return { ...doc, blocks: [...doc.blocks, newBlock] };
      const idx = doc.blocks.findIndex(b => b.id === afterId);
      const blocks = [...doc.blocks];
      blocks.splice(idx + 1, 0, newBlock);
      return { ...doc, blocks };
    });
    return newBlock.id;
  }, [updateDoc]);

  const deleteBlock = useCallback((blockId: string) => {
    updateDoc(doc => ({
      ...doc,
      blocks: doc.blocks.filter(b => b.id !== blockId),
    }));
  }, [updateDoc]);

  const selectDocument = useCallback((id: string) => {
    const found = documents.find(d => d.doc.meta.id === id);
    if (found) {
      setActiveDocId(id);
      setActiveDoc(found.doc);
      setStats(found.stats);
    }
  }, [documents]);

  const createDocument = useCallback((title?: string) => {
    const doc = createNewDocument(title);
    const cached: CachedDocument = {
      doc,
      stats: estimateCompression(doc, estimateDocumentSize(doc) * 4),
      size: estimateDocumentSize(doc),
    };
    saveDocument(cached).then(() => {
      setDocuments(prev => [cached, ...prev]);
      setActiveDocId(doc.meta.id);
      setActiveDoc(doc);
      setStats(cached.stats);
    });
  }, []);

  const removeDocument = useCallback(async (id: string) => {
    await deleteDocument(id);
    setDocuments(prev => {
      const next = prev.filter(d => d.doc.meta.id !== id);
      if (activeDocId === id && next.length > 0) {
        setActiveDocId(next[0].doc.meta.id);
        setActiveDoc(next[0].doc);
        setStats(next[0].stats);
      }
      return next;
    });
  }, [activeDocId]);

  return {
    documents, activeDoc, activeDocId, stats, loading, saving,
    updateDoc, updateBlock, addBlock, deleteBlock,
    selectDocument, createDocument, removeDocument,
  };
}
