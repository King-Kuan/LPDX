import { Download, FileJson, FileText, FileType2, X } from "lucide-react";

interface ExportSheetProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: "lpdx" | "pdf" | "txt") => void;
}

export function ExportSheet({ open, onClose, onExport }: ExportSheetProps) {
  if (!open) return null;

  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet-panel" onClick={(event) => event.stopPropagation()}>
        <div className="inline-between">
          <div>
            <h3 style={{ margin: 0 }}>Export document</h3>
            <p className="helper-text" style={{ marginBottom: 0 }}>Choose the format you want to download.</p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="sheet-actions">
          <button className="ghost-btn" onClick={() => onExport("lpdx")}>
            <FileJson size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
            Download .lpdx
          </button>
          <button className="ghost-btn" onClick={() => onExport("pdf")}>
            <FileType2 size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
            Download PDF
          </button>
          <button className="ghost-btn" onClick={() => onExport("txt")}>
            <FileText size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
            Download TXT
          </button>
          <button className="primary-btn" onClick={onClose}>
            <Download size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
