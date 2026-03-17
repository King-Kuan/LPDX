import type { EditorStats } from "@/types/editor";
import { SectionCard } from "@/components/ui/SectionCard";

interface StatBarProps {
  stats: EditorStats;
  totalDocs: number;
  storageLabel: string;
}

export function StatBar({ stats, totalDocs, storageLabel }: StatBarProps) {
  return (
    <SectionCard title="Workspace stats" description="Useful signals while writing and organizing.">
      <div className="stats-grid">
        <div className="stat-chip"><span>Total docs</span><strong>{totalDocs}</strong></div>
        <div className="stat-chip"><span>Words</span><strong>{stats.words}</strong></div>
        <div className="stat-chip"><span>Characters</span><strong>{stats.characters}</strong></div>
        <div className="stat-chip"><span>Blocks</span><strong>{stats.blocks}</strong></div>
        <div className="stat-chip"><span>Read time</span><strong>{stats.readingMinutes} min</strong></div>
        <div className="stat-chip"><span>Storage</span><strong>{storageLabel}</strong></div>
      </div>
    </SectionCard>
  );
}
