"use client";

import { useEffect, useMemo, useState } from "react";
import type { DocumentBlock, LightDoc, BlockType } from "@/types/editor";
import { STORAGE_KEY } from "@/lib/constants";
import { createId } from "@/lib/id";
import { createBlankDocument, createMeetingTemplate, createWelcomeDocument } from "@/lib/templates";
import { computeStats } from "@/lib/stats";

function reviveDocuments(raw: string | null): LightDoc[] {
  if (!raw) return [createWelcomeDocument(), createMeetingTemplate()];
  try {
    const parsed = JSON.parse(raw) as LightDoc[];
    return parsed.length ? parsed : [createWelcomeDocument()];
  } catch {
    return [createWelcomeDocument()];
  }
}

export function useDocuments() {
  const [documents, setDocuments] = useState<LightDoc[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initial = reviveDocuments(localStorage.getItem(STORAGE_KEY));
    setDocuments(initial);
    setActiveId(initial[0]?.id ?? "");
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  }, [documents, isReady]);

  const activeDoc = useMemo(
    () => documents.find((doc) => doc.id === activeId) ?? documents[0] ?? null,
    [documents, activeId]
  );

  const stats = useMemo(() => computeStats(activeDoc), [activeDoc]);

  const updateDocument = (docId: string, updater: (doc: LightDoc) => LightDoc) => {
    setDocuments((current) =>
      current.map((doc) =>
        doc.id === docId
          ? updater({
              ...doc,
              meta: { ...doc.meta, updatedAt: new Date().toISOString() },
            })
          : doc
      )
    );
  };

  const createDocument = (title?: string) => {
    const next = createBlankDocument(title);
    setDocuments((current) => [next, ...current]);
    setActiveId(next.id);
  };

  const createTemplateDocument = () => {
    const next = createMeetingTemplate();
    setDocuments((current) => [next, ...current]);
    setActiveId(next.id);
  };

  const deleteDocument = (docId: string) => {
    setDocuments((current) => {
      const remaining = current.filter((doc) => doc.id !== docId);
      if (remaining.length === 0) {
        const fallback = createBlankDocument("Fresh Palace Note");
        setActiveId(fallback.id);
        return [fallback];
      }
      if (activeId === docId) setActiveId(remaining[0].id);
      return remaining;
    });
  };

  const duplicateDocument = (docId: string) => {
    const source = documents.find((doc) => doc.id === docId);
    if (!source) return;
    const cloned: LightDoc = {
      ...source,
      id: createId("doc"),
      meta: {
        ...source.meta,
        title: `${source.meta.title} Copy`,
        updatedAt: new Date().toISOString(),
      },
      blocks: source.blocks.map((block) => ({ ...block, id: createId("block") })),
    };
    setDocuments((current) => [cloned, ...current]);
    setActiveId(cloned.id);
  };

  const importDocument = (doc: LightDoc) => {
    const next = {
      ...doc,
      id: createId("doc"),
      meta: {
        ...doc.meta,
        updatedAt: new Date().toISOString(),
      },
      blocks: doc.blocks.map((block) => ({ ...block, id: createId("block") })),
    };
    setDocuments((current) => [next, ...current]);
    setActiveId(next.id);
  };

  const addBlock = (type: BlockType) => {
    if (!activeDoc) return;
    const newBlock: DocumentBlock = {
      id: createId("block"),
      type,
      content: "",
      checked: false,
    };
    updateDocument(activeDoc.id, (doc) => ({ ...doc, blocks: [...doc.blocks, newBlock] }));
  };

  const updateBlock = (blockId: string, changes: Partial<DocumentBlock>) => {
    if (!activeDoc) return;
    updateDocument(activeDoc.id, (doc) => ({
      ...doc,
      blocks: doc.blocks.map((block) => (block.id === blockId ? { ...block, ...changes } : block)),
    }));
  };

  const deleteBlock = (blockId: string) => {
    if (!activeDoc) return;
    updateDocument(activeDoc.id, (doc) => ({
      ...doc,
      blocks: doc.blocks.length > 1 ? doc.blocks.filter((block) => block.id !== blockId) : doc.blocks,
    }));
  };

  const moveBlock = (blockId: string, direction: "up" | "down") => {
    if (!activeDoc) return;
    updateDocument(activeDoc.id, (doc) => {
      const index = doc.blocks.findIndex((block) => block.id === blockId);
      if (index < 0) return doc;
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= doc.blocks.length) return doc;
      const next = [...doc.blocks];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...doc, blocks: next };
    });
  };

  const storageBytes = new Blob([JSON.stringify(documents)]).size;

  return {
    isReady,
    documents,
    activeDoc,
    activeId,
    stats,
    storageBytes,
    setActiveId,
    createDocument,
    createTemplateDocument,
    deleteDocument,
    duplicateDocument,
    importDocument,
    updateDocument,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
  };
}
