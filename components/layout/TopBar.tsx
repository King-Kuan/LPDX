import { Menu, PanelLeftClose, PanelsTopLeft, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";

interface TopBarProps {
  title: string;
  onOpenDocs: () => void;
  onOpenInspector: () => void;
  onOpenExport: () => void;
  rightSlot?: ReactNode;
}

export function TopBar({ title, onOpenDocs, onOpenInspector, onOpenExport, rightSlot }: TopBarProps) {
  return (
    <header className="topbar">
      <button className="icon-btn mobile-only" onClick={onOpenDocs} aria-label="Open documents">
        <Menu size={18} />
      </button>
      <div className="topbar__title">
        <h1>{title}</h1>
        <p>Android-friendly document workspace</p>
      </div>
      <button className="icon-btn" onClick={onOpenExport} aria-label="Open export tools">
        <PanelsTopLeft size={18} />
      </button>
      <button className="icon-btn mobile-only" onClick={onOpenInspector} aria-label="Open inspector">
        <SlidersHorizontal size={18} />
      </button>
      <div className="overlay-hidden-mobile">{rightSlot}</div>
      <div className="mobile-only">
        <button className="icon-btn" onClick={onOpenDocs} aria-label="Open workspace panel">
          <PanelLeftClose size={18} />
        </button>
      </div>
    </header>
  );
}
