import { PenTool } from "lucide-react";

export function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="section-card empty-state">
      <div style={{ display: "grid", placeItems: "center", marginBottom: "1rem" }}>
        <div className="brand-mark__logo">
          <PenTool size={18} />
        </div>
      </div>
      <h2 style={{ margin: 0 }}>Start your first Palace document</h2>
      <p className="helper-text">
        Create a fresh file, write naturally on mobile, and get ready for future .lpdx reader support.
      </p>
      <button className="primary-btn" onClick={onCreate}>Create document</button>
    </section>
  );
}
