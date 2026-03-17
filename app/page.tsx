"use client";

import { useMemo, useRef, useState } from "react";
import { parseLpdx } from "@/lib/lpdx";
import { downloadAsLpdx, downloadAsPdf, downloadAsTxt } from "@/lib/exporters";
import { APP_NAME, RIGHTS_HOLDER } from "@/lib/constants";
import { getThemeLabel } from "@/lib/theme";
import { useDocuments } from "@/hooks/useDocuments";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { AppShell } from "@/components/layout/AppShell";
import { BrandMark } from "@/components/ui/BrandMark";
import { MobileTabs } from "@/components/layout/MobileTabs";
import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/navigation/Sidebar";
import { EmptyState } from "@/components/editor/EmptyState";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { InspectorPanel } from "@/components/inspector/InspectorPanel";
import { ExportSheet } from "@/components/sheets/ExportSheet";
import { ImportCard } from "@/components/sheets/ImportCard";
import { StatBar } from "@/components/stats/StatBar";
import { SectionCard } from "@/components/ui/SectionCard";
import type { BlockType } from "@/types/editor";

export default function Home() {
  const {
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
  } = useDocuments();

  const [leftOpen, setLeftOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [tab, setTab] = useState<"write" | "docs" | "tools">("write");
  const isDesktop = useMediaQuery("(min-width: 1100px)");
  const importRef = useRef<HTMLInputElement | null>(null);

  const totalDocs = documents.length;
  const storageLabel = useMemo(() => `${(storageBytes / 1024).toFixed(1)} KB`, [storageBytes]);

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    const doc = parseLpdx(text);
    importDocument(doc);
    setLeftOpen(false);
  };

  const handleExport = async (format: "lpdx" | "pdf" | "txt") => {
    if (!activeDoc) return;
    if (format === "lpdx") await downloadAsLpdx(activeDoc);
    if (format === "pdf") await downloadAsPdf(activeDoc);
    if (format === "txt") await downloadAsTxt(activeDoc);
    setExportOpen(false);
  };

  const addTypedBlock = (type: BlockType) => {
    addBlock(type);
  };

  if (!isReady) {
    return (
      <main className="boot-screen">
        <BrandMark compact />
        <p>Loading your Palace workspace…</p>
      </main>
    );
  }

  return (
    <AppShell
      topbar={
        <TopBar
          title={activeDoc?.meta.title ?? APP_NAME}
          onOpenDocs={() => setLeftOpen(true)}
          onOpenInspector={() => setInspectorOpen(true)}
          onOpenExport={() => setExportOpen(true)}
          rightSlot={<BrandMark compact />}
        />
      }
      sidebar={
        <Sidebar
          documents={documents}
          activeId={activeId}
          onSelect={(id) => {
            setActiveId(id);
            setLeftOpen(false);
            setTab("write");
          }}
          onCreate={() => createDocument()}
          onCreateTemplate={() => createTemplateDocument()}
          onDuplicate={duplicateDocument}
          onDelete={deleteDocument}
          onImport={() => importRef.current?.click()}
        />
      }
      sidebarOpen={isDesktop || leftOpen}
      onCloseSidebar={() => setLeftOpen(false)}
      inspector={
        activeDoc ? (
          <InspectorPanel
            doc={activeDoc}
            themeLabel={getThemeLabel(activeDoc)}
            stats={stats}
            onMetaChange={(changes) =>
              updateDocument(activeDoc.id, (doc) => ({ ...doc, meta: { ...doc.meta, ...changes } }))
            }
            onToggleStar={() =>
              updateDocument(activeDoc.id, (doc) => ({ ...doc, starred: !doc.starred }))
            }
          />
        ) : null
      }
      inspectorOpen={isDesktop || inspectorOpen}
      onCloseInspector={() => setInspectorOpen(false)}
      footer={
        <div className="rights-footer">
          <span>© 2026 {RIGHTS_HOLDER}</span>
          <span>Android-ready progressive editor</span>
        </div>
      }
    >
      <input
        ref={importRef}
        type="file"
        accept=".lpdx,application/json"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleImportFile(file);
          event.currentTarget.value = "";
        }}
      />

      <div className="workspace-stack">
        <StatBar stats={stats} totalDocs={totalDocs} storageLabel={storageLabel} />
        {!activeDoc ? (
          <EmptyState onCreate={() => createDocument("Fresh Palace Note")} />
        ) : (
          <>
            <SectionCard
              title="Quick tools"
              description="Block actions that feel comfortable on phones and tablets."
              action={
                <button className="ghost-btn" onClick={() => setExportOpen(true)}>
                  Export
                </button>
              }
            >
              <div className="quick-grid">
                {(["title", "heading", "paragraph", "quote", "checklist"] as BlockType[]).map((type) => (
                  <button key={type} className="quick-pill" onClick={() => addTypedBlock(type)}>
                    Add {type}
                  </button>
                ))}
              </div>
            </SectionCard>

            <EditorCanvas
              doc={activeDoc}
              onMetaChange={(changes) =>
                updateDocument(activeDoc.id, (doc) => ({ ...doc, meta: { ...doc.meta, ...changes } }))
              }
              onBlockChange={updateBlock}
              onAddBlock={addTypedBlock}
              onDeleteBlock={deleteBlock}
              onMoveBlock={moveBlock}
            />

            <ImportCard />
          </>
        )}
      </div>

      {!isDesktop && (
        <>
          <MobileTabs
            value={tab}
            onChange={(value) => {
              setTab(value);
              if (value === "docs") setLeftOpen(true);
              if (value === "tools") setInspectorOpen(true);
            }}
          />
          <ExportSheet open={exportOpen} onClose={() => setExportOpen(false)} onExport={handleExport} />
        </>
      )}
      {isDesktop && <ExportSheet open={exportOpen} onClose={() => setExportOpen(false)} onExport={handleExport} />}
    </AppShell>
  );
}
