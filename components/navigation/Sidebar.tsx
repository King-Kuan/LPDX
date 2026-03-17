import { Copy, FilePlus2, Import, NotebookPen, Trash2 } from "lucide-react";
import type { LightDoc } from "@/types/editor";
import { SectionCard } from "@/components/ui/SectionCard";

interface SidebarProps {
  documents: LightDoc[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onCreateTemplate: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onImport: () => void;
}

export function Sidebar({
  documents,
  activeId,
  onSelect,
  onCreate,
  onCreateTemplate,
  onDuplicate,
  onDelete,
  onImport,
}: SidebarProps) {
  return (
    <aside className="sidebar-panel">
      <SectionCard
        title="Workspace"
        description="Create, duplicate and switch documents quickly."
        action={
          <button className="primary-btn" onClick={onCreate}>
            <FilePlus2 size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
            New
          </button>
        }
      >
        <div className="panel-stack">
          <div className="panel-actions">
            <button className="ghost-btn" onClick={onCreateTemplate}>
              <NotebookPen size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
              Template
            </button>
            <button className="ghost-btn" onClick={onImport}>
              <Import size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
              Import
            </button>
          </div>

          <div className="doc-list">
            {documents.map((doc) => (
              <article
                key={doc.id}
                className={`doc-card ${activeId === doc.id ? "doc-card--active" : ""}`}
                onClick={() => onSelect(doc.id)}
                role="button"
              >
                <h3>{doc.meta.title}</h3>
                <p>{doc.meta.description || "No description yet."}</p>
                <div className="doc-card__meta">
                  <span>{doc.blocks.length} blocks</span>
                  <span>{doc.meta.theme}</span>
                  {doc.starred ? <span>★ starred</span> : null}
                </div>
                <div className="doc-card__actions">
                  <button className="ghost-btn" onClick={(e) => { e.stopPropagation(); onDuplicate(doc.id); }}>
                    <Copy size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
                    Copy
                  </button>
                  <button className="danger-btn" onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}>
                    <Trash2 size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </SectionCard>
    </aside>
  );
}
