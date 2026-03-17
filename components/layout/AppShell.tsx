import type { ReactNode } from "react";

interface AppShellProps {
  topbar: ReactNode;
  sidebar: ReactNode;
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
  inspector: ReactNode;
  inspectorOpen: boolean;
  onCloseInspector: () => void;
  children: ReactNode;
  footer: ReactNode;
}

export function AppShell({
  topbar,
  sidebar,
  sidebarOpen,
  onCloseSidebar,
  inspector,
  inspectorOpen,
  onCloseInspector,
  children,
  footer,
}: AppShellProps) {
  return (
    <main className="app-shell">
      {topbar}
      <div className="shell-grid">
        {sidebarOpen ? (
          <div className="overlay-hidden-mobile">{sidebar}</div>
        ) : null}
        {!sidebarOpen ? null : (
          <div className="mobile-only" onClick={onCloseSidebar}>
            <div className="sheet-wrap" onClick={onCloseSidebar}>
              <div className="sheet-panel" onClick={(event) => event.stopPropagation()}>
                {sidebar}
              </div>
            </div>
          </div>
        )}
        {children}
        {inspectorOpen ? (
          <div className="overlay-hidden-mobile">{inspector}</div>
        ) : null}
        {!inspectorOpen ? null : (
          <div className="mobile-only" onClick={onCloseInspector}>
            <div className="sheet-wrap" onClick={onCloseInspector}>
              <div className="sheet-panel" onClick={(event) => event.stopPropagation()}>
                {inspector}
              </div>
            </div>
          </div>
        )}
      </div>
      {footer}
    </main>
  );
}
