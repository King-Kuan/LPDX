import { FileText, PenSquare, Wrench } from "lucide-react";

interface MobileTabsProps {
  value: "write" | "docs" | "tools";
  onChange: (value: "write" | "docs" | "tools") => void;
}

export function MobileTabs({ value, onChange }: MobileTabsProps) {
  return (
    <nav className="mobile-tabs">
      {[
        { id: "write", label: "Write", icon: PenSquare },
        { id: "docs", label: "Docs", icon: FileText },
        { id: "tools", label: "Tools", icon: Wrench },
      ].map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={`mobile-tab ${value === id ? "mobile-tab--active" : ""}`}
          onClick={() => onChange(id as "write" | "docs" | "tools")}
        >
          <Icon size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
          {label}
        </button>
      ))}
    </nav>
  );
}
