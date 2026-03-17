import { MoveDown, MoveUp, Trash2 } from "lucide-react";
import type { BlockType, DocumentBlock, LightDoc } from "@/types/editor";
import { SectionCard } from "@/components/ui/SectionCard";

interface EditorCanvasProps {
  doc: LightDoc;
  onMetaChange: (changes: Partial<LightDoc["meta"]>) => void;
  onBlockChange: (blockId: string, changes: Partial<DocumentBlock>) => void;
  onAddBlock: (type: BlockType) => void;
  onDeleteBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, direction: "up" | "down") => void;
}

export function EditorCanvas({
  doc,
  onMetaChange,
  onBlockChange,
  onAddBlock,
  onDeleteBlock,
  onMoveBlock,
}: EditorCanvasProps) {
  return (
    <section className="editor-card">
      <SectionCard title="Document details" description="Keep title and metadata clean for export.">
        <div className="meta-grid">
          <input
            className="field"
            value={doc.meta.title}
            onChange={(event) => onMetaChange({ title: event.target.value })}
            placeholder="Document title"
          />
          <input
            className="field"
            value={doc.meta.author}
            onChange={(event) => onMetaChange({ author: event.target.value })}
            placeholder="Author"
          />
          <textarea
            className="textarea"
            value={doc.meta.description}
            onChange={(event) => onMetaChange({ description: event.target.value })}
            placeholder="Short description"
          />
          <div className="panel-stack">
            <select
              className="select"
              value={doc.meta.theme}
              onChange={(event) => onMetaChange({ theme: event.target.value as LightDoc["meta"]["theme"] })}
            >
              <option value="midnight">Midnight</option>
              <option value="royal">Royal</option>
              <option value="emerald">Emerald</option>
            </select>
            <input
              className="field"
              value={doc.meta.tags.join(", ")}
              onChange={(event) =>
                onMetaChange({
                  tags: event.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                })
              }
              placeholder="tags, separated, by, commas"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Blocks" description="Structured writing that is easy to move and refine.">
        <div className="editor-toolbar">
          {(["title", "heading", "paragraph", "quote", "checklist"] as BlockType[]).map((type) => (
            <button key={type} className="ghost-btn" onClick={() => onAddBlock(type)}>
              Add {type}
            </button>
          ))}
        </div>
        <div className="block-list" style={{ marginTop: "1rem" }}>
          {doc.blocks.map((block, index) => (
            <article key={block.id} className="block-card">
              <div className="block-card__head">
                <span className="badge">{block.type}</span>
                <div className="block-card__actions">
                  <button className="icon-btn" onClick={() => onMoveBlock(block.id, "up")} disabled={index === 0}>
                    <MoveUp size={14} />
                  </button>
                  <button className="icon-btn" onClick={() => onMoveBlock(block.id, "down")} disabled={index === doc.blocks.length - 1}>
                    <MoveDown size={14} />
                  </button>
                  <button className="icon-btn" onClick={() => onDeleteBlock(block.id)} aria-label="Delete block">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {block.type === "checklist" ? (
                <div className="check-row">
                  <input
                    type="checkbox"
                    checked={Boolean(block.checked)}
                    onChange={(event) => onBlockChange(block.id, { checked: event.target.checked })}
                  />
                  <textarea
                    className="textarea"
                    value={block.content}
                    onChange={(event) => onBlockChange(block.id, { content: event.target.value })}
                    placeholder="Checklist item"
                  />
                </div>
              ) : block.type === "quote" ? (
                <div className="quote-box">
                  <textarea
                    className="textarea"
                    value={block.content}
                    onChange={(event) => onBlockChange(block.id, { content: event.target.value })}
                    placeholder="Quote block"
                  />
                </div>
              ) : (
                <textarea
                  className="textarea"
                  value={block.content}
                  onChange={(event) => onBlockChange(block.id, { content: event.target.value })}
                  placeholder={`Write your ${block.type}`}
                />
              )}
            </article>
          ))}
        </div>
      </SectionCard>
    </section>
  );
}
