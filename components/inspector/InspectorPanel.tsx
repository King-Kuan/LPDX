import { Sparkles, Star } from "lucide-react";
import type { EditorStats, LightDoc } from "@/types/editor";
import { SectionCard } from "@/components/ui/SectionCard";

interface InspectorPanelProps {
  doc: LightDoc;
  stats: EditorStats;
  themeLabel: string;
  onMetaChange: (changes: Partial<LightDoc["meta"]>) => void;
  onToggleStar: () => void;
}

export function InspectorPanel({ doc, stats, themeLabel, onMetaChange, onToggleStar }: InspectorPanelProps) {
  return (
    <aside className="inspector-panel">
      <div className="panel-stack">
        <SectionCard
          title="Inspector"
          description="Fast controls for mobile-friendly editing."
          action={
            <button className="ghost-btn" onClick={onToggleStar}>
              <Star size={15} style={{ marginRight: 6, verticalAlign: "middle" }} />
              {doc.starred ? "Unstar" : "Star"}
            </button>
          }
        >
          <div className="stats-grid">
            <div className="stat-chip"><span>Theme</span><strong>{themeLabel}</strong></div>
            <div className="stat-chip"><span>Words</span><strong>{stats.words}</strong></div>
            <div className="stat-chip"><span>Read time</span><strong>{stats.readingMinutes} min</strong></div>
          </div>
        </SectionCard>

        <SectionCard title="Presentation" description="Tweak metadata and export appearance.">
          <div className="panel-stack">
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
              placeholder="Description"
            />
          </div>
        </SectionCard>

        <SectionCard title="Roadmap note" description="What comes next for this app.">
          <p className="helper-text">
            The next step is a dedicated <strong>.lpdx reader</strong> that can open, preview, and navigate exported files with cleaner viewer controls.
          </p>
          <div className="badge">
            <Sparkles size={14} />
            Prepared for future reader mode
          </div>
        </SectionCard>
      </div>
    </aside>
  );
}
