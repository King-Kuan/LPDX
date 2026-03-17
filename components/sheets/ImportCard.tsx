import { FolderInput } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";

export function ImportCard() {
  return (
    <SectionCard title="LPDX compatibility" description="This build already understands exported .lpdx JSON packages.">
      <div className="inline-between">
        <div>
          <h3 style={{ margin: 0, fontSize: "0.98rem" }}>Import-ready foundation</h3>
          <p className="helper-text" style={{ marginBottom: 0 }}>
            The editor can import previously exported .lpdx files, and the next build can focus on full reader mode without changing the core document format.
          </p>
        </div>
        <div className="brand-mark__logo">
          <FolderInput size={18} />
        </div>
      </div>
    </SectionCard>
  );
}
