import type { CachedDocument, LightDocument } from '@/types';

const DB_NAME = 'lightdoc-studio';
const DB_VERSION = 1;
const STORE_DOCS = 'documents';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_DOCS)) {
        const store = db.createObjectStore(STORE_DOCS, { keyPath: 'doc.meta.id' });
        store.createIndex('updatedAt', 'doc.meta.updatedAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDocument(cached: CachedDocument): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DOCS, 'readwrite');
    tx.objectStore(STORE_DOCS).put(cached);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadDocument(id: string): Promise<CachedDocument | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DOCS, 'readonly');
    const req = tx.objectStore(STORE_DOCS).get(id);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function listDocuments(): Promise<CachedDocument[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DOCS, 'readonly');
    const req = tx.objectStore(STORE_DOCS).index('updatedAt').getAll();
    req.onsuccess = () => resolve((req.result as CachedDocument[]).reverse());
    req.onerror = () => reject(req.error);
  });
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DOCS, 'readwrite');
    tx.objectStore(STORE_DOCS).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getStorageSize(): Promise<number> {
  const docs = await listDocuments();
  return docs.reduce((sum, d) => sum + (d.size || 0), 0);
}

export function createNewDocument(title = 'Untitled Document'): LightDocument {
  const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    meta: {
      id,
      title,
      subtitle: '',
      author: '',
      organization: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pageSize: 'A4',
      tags: [],
    },
    blocks: [
      {
        id: `blk_${Date.now()}`,
        type: 'paragraph',
        content: '',
      },
    ],
    compressionMode: 'balanced',
    imageQuality: 75,
    enableOCR: true,
    embedFonts: true,
    pdfArchival: false,
  };
}
